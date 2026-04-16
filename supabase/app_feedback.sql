-- ============================================================================
-- Mindset — App feedback from testers
-- Run once in Supabase SQL Editor.
-- ============================================================================

create table if not exists public.app_feedback (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete set null,
  display_name text,
  role text,
  feedback_type text not null check (feedback_type in ('bug', 'idea', 'other')),
  text text not null,
  page text,
  created_at timestamptz not null default now()
);

create index if not exists app_feedback_created_idx
  on public.app_feedback(created_at desc);

alter table public.app_feedback enable row level security;

-- Anyone signed in can submit feedback.
drop policy if exists "app_feedback_insert" on public.app_feedback;
create policy "app_feedback_insert" on public.app_feedback
  for insert with check (auth.uid() = account_id);

-- Users can see their own submissions.
drop policy if exists "app_feedback_read_own" on public.app_feedback;
create policy "app_feedback_read_own" on public.app_feedback
  for select using (auth.uid() = account_id);
