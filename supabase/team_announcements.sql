-- ============================================================================
-- Mindset — Team announcements
--
-- One-way broadcasts from a coach to their connected athletes and those
-- athletes' parents. Not a conversation — no replies. Each reader can
-- mark read independently; announcements auto-hide after `expires_at`.
--
-- Visibility model:
--   Coach authors → all athletes they're connected to + all parents
--   connected to any of those same athletes.
--   Enforced via a security-definer helper function to keep the RLS
--   expressions readable and avoid self-referential policy recursion.
--
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper: is the caller in the coach's team? (self, athlete, or that
-- athlete's parent)
-- ---------------------------------------------------------------------------
create or replace function public.is_in_coach_team(p_coach uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $func$
  -- Self
  select exists (
    select 1 where p_coach = auth.uid()
  )
  -- Athlete directly connected to the coach
  or exists (
    select 1 from public.connections c
    where c.athlete_account_id = auth.uid()
      and c.other_account_id = p_coach
      and c.status = 'accepted'
  )
  -- Parent connected to an athlete that's also connected to the coach
  or exists (
    select 1
    from public.connections my_conn
    join public.connections coach_conn
      on coach_conn.athlete_account_id = my_conn.athlete_account_id
    where my_conn.other_account_id = auth.uid()
      and my_conn.status = 'accepted'
      and coach_conn.other_account_id = p_coach
      and coach_conn.status = 'accepted'
  );
$func$;

revoke all on function public.is_in_coach_team(uuid) from public;
grant execute on function public.is_in_coach_team(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Announcements
-- ---------------------------------------------------------------------------
create table if not exists public.team_announcements (
  id uuid primary key default gen_random_uuid(),
  coach_account_id uuid not null references public.accounts(id) on delete cascade,
  title text check (title is null or char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 2000),
  -- Optional expiration. Rendered-side filters to created_at > now - 14d
  -- as a safety floor; server-side we trust whatever value the coach set.
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists team_announcements_coach_idx
  on public.team_announcements(coach_account_id, created_at desc);

alter table public.team_announcements enable row level security;

drop policy if exists team_announcements_select on public.team_announcements;
create policy team_announcements_select on public.team_announcements
  for select to authenticated using (
    public.is_in_coach_team(coach_account_id)
  );

drop policy if exists team_announcements_insert on public.team_announcements;
create policy team_announcements_insert on public.team_announcements
  for insert to authenticated with check (
    coach_account_id = auth.uid()
    and exists (
      select 1 from public.accounts a
      where a.id = auth.uid() and a.role = 'coach'
    )
  );

drop policy if exists team_announcements_update on public.team_announcements;
create policy team_announcements_update on public.team_announcements
  for update to authenticated
  using (coach_account_id = auth.uid())
  with check (coach_account_id = auth.uid());

drop policy if exists team_announcements_delete on public.team_announcements;
create policy team_announcements_delete on public.team_announcements
  for delete to authenticated using (coach_account_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Per-reader read marks
-- ---------------------------------------------------------------------------
create table if not exists public.team_announcement_reads (
  announcement_id uuid not null references public.team_announcements(id) on delete cascade,
  reader_account_id uuid not null references public.accounts(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, reader_account_id)
);

alter table public.team_announcement_reads enable row level security;

drop policy if exists team_announcement_reads_select on public.team_announcement_reads;
create policy team_announcement_reads_select on public.team_announcement_reads
  for select to authenticated using (reader_account_id = auth.uid());

drop policy if exists team_announcement_reads_insert on public.team_announcement_reads;
create policy team_announcement_reads_insert on public.team_announcement_reads
  for insert to authenticated with check (reader_account_id = auth.uid());

-- Realtime so everyone's announcement card updates live when the coach
-- posts (and the unread count drops the moment they mark-read).
do $$
begin
  alter publication supabase_realtime add table public.team_announcements;
exception
  when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.team_announcement_reads;
exception
  when duplicate_object then null;
end $$;
