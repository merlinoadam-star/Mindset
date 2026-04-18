-- ============================================================================
-- Mindset — Adult Chats
--
-- A private 1:1 message channel between a coach and a parent, scoped to a
-- specific athlete. The athlete themselves has NO access to these
-- messages — not via RLS, not via the UI.
--
-- Design principles:
--   * Transparent, not secret. The athlete is told in-app that adults
--     can message each other about how to support them. No hiding.
--   * Scoped per (athlete, coach, parent) triple. One thread per pair.
--     If an athlete has dad + coach + assistant coach, that's 3 pairs
--     = 3 threads (dad↔coach, dad↔assistant, coach↔assistant — actually
--     only the coach+parent combinations; coach↔coach goes through a
--     different channel if needed).
--   * Both the coach and the parent must have an accepted connection to
--     the athlete before a thread can exist. Enforced on insert.
--
-- Run once in the SQL Editor. Idempotent.
-- ============================================================================

create table if not exists public.adult_chats (
  id uuid primary key default gen_random_uuid(),
  athlete_account_id uuid not null references public.accounts(id) on delete cascade,
  coach_account_id uuid not null references public.accounts(id) on delete cascade,
  parent_account_id uuid not null references public.accounts(id) on delete cascade,
  sender_account_id uuid not null references public.accounts(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Fast thread reads (a thread is defined by the triple).
create index if not exists adult_chats_thread_idx
  on public.adult_chats(
    athlete_account_id,
    coach_account_id,
    parent_account_id,
    created_at desc
  );

-- Fast "unread for me" lookups.
create index if not exists adult_chats_unread_idx
  on public.adult_chats(coach_account_id, parent_account_id, read_at)
  where read_at is null;

alter table public.adult_chats enable row level security;

-- SELECT — only the two participants in this specific thread.
-- Critically, the athlete (even though they're the SUBJECT) cannot read.
drop policy if exists adult_chats_select on public.adult_chats;
create policy adult_chats_select
  on public.adult_chats
  for select
  to authenticated
  using (
    auth.uid() = coach_account_id
    or auth.uid() = parent_account_id
  );

-- INSERT — only the coach or parent in the thread can write, and only
-- as themselves. Additionally, both sides must have an accepted
-- connection to the athlete, so you can't fabricate an arbitrary
-- thread.
drop policy if exists adult_chats_insert on public.adult_chats;
create policy adult_chats_insert
  on public.adult_chats
  for insert
  to authenticated
  with check (
    sender_account_id = auth.uid()
    and (auth.uid() = coach_account_id or auth.uid() = parent_account_id)
    and exists (
      select 1 from public.connections c
      where c.athlete_account_id = adult_chats.athlete_account_id
        and c.other_account_id = adult_chats.coach_account_id
        and c.status = 'accepted'
    )
    and exists (
      select 1 from public.connections c
      where c.athlete_account_id = adult_chats.athlete_account_id
        and c.other_account_id = adult_chats.parent_account_id
        and c.status = 'accepted'
    )
  );

-- UPDATE — participants can only mark the OTHER person's messages as
-- read. We can't restrict the set of writable columns via RLS, so the
-- client code should only update `read_at`. If that trust boundary
-- matters more, convert to an RPC.
drop policy if exists adult_chats_update on public.adult_chats;
create policy adult_chats_update
  on public.adult_chats
  for update
  to authenticated
  using (
    (auth.uid() = coach_account_id or auth.uid() = parent_account_id)
    and sender_account_id != auth.uid()
  )
  with check (
    (auth.uid() = coach_account_id or auth.uid() = parent_account_id)
  );

-- DELETE — either participant can delete their own messages. Not used
-- in the v1 UI but useful if we add edit/delete later.
drop policy if exists adult_chats_delete on public.adult_chats;
create policy adult_chats_delete
  on public.adult_chats
  for delete
  to authenticated
  using (sender_account_id = auth.uid());

-- Realtime — participants get live updates.
do $$
begin
  alter publication supabase_realtime add table public.adult_chats;
exception
  when duplicate_object then null;
end $$;
