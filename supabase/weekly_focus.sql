-- ============================================================================
-- Mindset — Phase 3A.1: weekly focus set by a connected coach / parent
-- Run this once in Supabase SQL Editor (idempotent).
--
-- One focus per (athlete, week). Upserting replaces the current week's
-- focus. Connected coaches and parents can write; athlete + connections
-- can read.
-- ============================================================================

create table if not exists public.weekly_focus (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  author_id uuid not null references public.accounts(id) on delete cascade,
  author_role text not null check (author_role in ('coach', 'parent', 'athlete')),
  week_start_date date not null,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (athlete_id, week_start_date)
);

create index if not exists weekly_focus_athlete_idx
  on public.weekly_focus(athlete_id);
create index if not exists weekly_focus_athlete_week_idx
  on public.weekly_focus(athlete_id, week_start_date desc);

alter table public.weekly_focus enable row level security;

-- Athlete sees their own, author sees theirs, connected coaches/parents can read.
drop policy if exists "wf_read" on public.weekly_focus;
create policy "wf_read" on public.weekly_focus
  for select using (
    auth.uid() = athlete_id
    or auth.uid() = author_id
    or public.is_connected_to_athlete(athlete_id)
  );

-- Connected coaches / parents (or the athlete themselves) can insert.
drop policy if exists "wf_insert" on public.weekly_focus;
create policy "wf_insert" on public.weekly_focus
  for insert with check (
    auth.uid() = author_id
    and (
      auth.uid() = athlete_id
      or public.is_connected_to_athlete(athlete_id)
    )
  );

-- Author can update / delete their own entries.
drop policy if exists "wf_update" on public.weekly_focus;
create policy "wf_update" on public.weekly_focus
  for update using (auth.uid() = author_id);

drop policy if exists "wf_delete" on public.weekly_focus;
create policy "wf_delete" on public.weekly_focus
  for delete using (auth.uid() = author_id);

-- Enable realtime so the athlete's dashboard updates live when the coach
-- sets a new focus.
do $$ begin
  alter publication supabase_realtime add table public.weekly_focus;
exception when duplicate_object then null;
end $$;
