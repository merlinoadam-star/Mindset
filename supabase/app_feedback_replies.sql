-- ============================================================================
-- Mindset — App feedback replies (threaded bug tickets)
--
-- Extends the existing app_feedback table with a reply thread. Root row
-- in `app_feedback` is the initial report; each follow-up is a row in
-- `app_feedback_replies` tied to it. When the coach deletes a ticket,
-- ON DELETE CASCADE wipes the whole conversation in one shot — matches
-- the "delete the whole conversation at once" requirement.
--
-- Visibility matches the existing list: anyone signed in can see all
-- replies (same as the root feedback in production), anyone signed in
-- can post a reply on any thread.
--
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================

create table if not exists public.app_feedback_replies (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.app_feedback(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  display_name text,
  role text,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists app_feedback_replies_fid_idx
  on public.app_feedback_replies(feedback_id, created_at);

alter table public.app_feedback_replies enable row level security;

-- SELECT — everyone signed in can read the full thread (same visibility
-- as the root report itself). If the root is hidden by RLS, replies are
-- effectively hidden too because the UI joins/queries by feedback_id.
drop policy if exists "app_feedback_replies_read" on public.app_feedback_replies;
create policy "app_feedback_replies_read" on public.app_feedback_replies
  for select to authenticated using (true);

-- INSERT — signed-in user posting as themselves on an existing ticket.
drop policy if exists "app_feedback_replies_insert" on public.app_feedback_replies;
create policy "app_feedback_replies_insert" on public.app_feedback_replies
  for insert to authenticated with check (
    account_id = auth.uid()
    and exists (
      select 1 from public.app_feedback f where f.id = feedback_id
    )
  );

-- No DELETE policy for replies individually. Deleting the root feedback
-- row cascades here automatically, and coach-only delete on the root is
-- already enforced by app_feedback_delete_coach.

-- Realtime so an open ticket updates live when someone replies.
do $$
begin
  alter publication supabase_realtime add table public.app_feedback_replies;
exception
  when duplicate_object then null;
end $$;

-- Broaden read access on the root feedback table so everyone signed in
-- sees the full running list of tickets. Ticket replies are only useful
-- if testers can see each other's reports to avoid duplicates and so
-- coaches can pull them into a conversation. Replaces the old
-- read-own-only policy.
drop policy if exists "app_feedback_read_own" on public.app_feedback;
drop policy if exists "app_feedback_read_all" on public.app_feedback;
create policy "app_feedback_read_all" on public.app_feedback
  for select to authenticated using (true);
