-- ============================================================================
-- Mindset — Phase 2C: coach / parent feedback on matches, videos, etc.
-- Run this once in Supabase SQL Editor (idempotent).
-- ============================================================================

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  author_id uuid not null references public.accounts(id) on delete cascade,
  author_role text not null check (author_role in ('athlete', 'coach', 'parent')),
  target_type text not null check (target_type in ('match', 'video', 'practice')),
  target_id uuid not null,
  text text not null,
  read_at timestamptz,           -- filled when the athlete first views it
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists feedback_athlete_idx on public.feedback(athlete_id);
create index if not exists feedback_target_idx
  on public.feedback(athlete_id, target_type, target_id);

alter table public.feedback enable row level security;

-- Athletes see all feedback aimed at them.
-- Authors (coach/parent/athlete) see what they've written.
-- Connected coaches / parents can read (they can see the thread
-- alongside the data they're already allowed to see).
drop policy if exists "feedback_read" on public.feedback;
create policy "feedback_read" on public.feedback
  for select using (
    auth.uid() = athlete_id
    or auth.uid() = author_id
    or public.is_connected_to_athlete(athlete_id)
  );

-- Coaches and parents who are connected to the athlete can write
-- feedback for that athlete. Athletes can write their own notes
-- (useful for self-reflection threads).
drop policy if exists "feedback_insert" on public.feedback;
create policy "feedback_insert" on public.feedback
  for insert with check (
    auth.uid() = author_id
    and (
      auth.uid() = athlete_id
      or public.is_connected_to_athlete(athlete_id)
    )
  );

-- Authors can edit and delete their own notes.
-- Athletes can also update a feedback row (for read_at) — the column-
-- level check below restricts which columns they can actually change.
drop policy if exists "feedback_update" on public.feedback;
create policy "feedback_update" on public.feedback
  for update using (
    auth.uid() = author_id
    or auth.uid() = athlete_id
  );

drop policy if exists "feedback_delete" on public.feedback;
create policy "feedback_delete" on public.feedback
  for delete using (auth.uid() = author_id);
