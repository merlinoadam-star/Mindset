-- ============================================================================
-- Mindset — Custom Habits
--
-- Athletes can invent their own daily habits in addition to the preset
-- list bundled in src/lib/habits.ts. A row here is the definition; the
-- existing habit_completions table tracks ticks per day (habit_id is
-- text, so it accepts both preset string ids like "hydration" and
-- UUIDs from this table).
--
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================

create table if not exists public.custom_habits (
  id uuid primary key default gen_random_uuid(),
  athlete_account_id uuid not null references public.accounts(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 60),
  description text check (description is null or char_length(description) <= 160),
  emoji text not null default '⭐',
  xp int not null default 10 check (xp between 0 and 50),
  category text not null default 'physical'
    check (category in ('physical', 'mental', 'recovery', 'skill')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_habits_athlete_idx
  on public.custom_habits(athlete_account_id, created_at desc);

alter table public.custom_habits enable row level security;

drop policy if exists custom_habits_select on public.custom_habits;
create policy custom_habits_select on public.custom_habits
  for select to authenticated using (
    athlete_account_id = auth.uid()
    or public.is_connected_to_athlete(athlete_account_id)
  );

drop policy if exists custom_habits_insert on public.custom_habits;
create policy custom_habits_insert on public.custom_habits
  for insert to authenticated with check (
    athlete_account_id = auth.uid()
  );

drop policy if exists custom_habits_update on public.custom_habits;
create policy custom_habits_update on public.custom_habits
  for update to authenticated
  using (athlete_account_id = auth.uid())
  with check (athlete_account_id = auth.uid());

drop policy if exists custom_habits_delete on public.custom_habits;
create policy custom_habits_delete on public.custom_habits
  for delete to authenticated using (athlete_account_id = auth.uid());

-- Realtime so a coach/parent looking at the athlete view sees the
-- new habit show up immediately, and so the athlete's other devices
-- stay in sync.
do $$
begin
  alter publication supabase_realtime add table public.custom_habits;
exception
  when duplicate_object then null;
end $$;
