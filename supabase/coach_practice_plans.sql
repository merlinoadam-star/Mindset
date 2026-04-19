-- ============================================================================
-- Mindset — Coach-pushed Practice Plans
--
-- A coach creates a daily practice plan for a specific athlete: a title plus
-- a list of drill items (label, optional description, XP reward). The
-- athlete sees it on their Dashboard as a checklist; ticking an item earns
-- that XP. Plans are scoped per (coach, athlete, day) so a coach can only
-- have one active plan per athlete per day — pushing again replaces.
--
-- Tables:
--   coach_practice_plans             — the plan definition (items in jsonb)
--   coach_practice_plan_completions  — per-item tick state, keyed per athlete
--
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Plan definitions
-- ---------------------------------------------------------------------------
create table if not exists public.coach_practice_plans (
  id uuid primary key default gen_random_uuid(),
  coach_account_id uuid not null references public.accounts(id) on delete cascade,
  athlete_account_id uuid not null references public.accounts(id) on delete cascade,
  date date not null,
  title text not null check (char_length(title) between 1 and 120),
  -- items shape: [{"id": "uuid-or-nanoid", "label": "...", "description": "...", "xp": 10}]
  items jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_account_id, athlete_account_id, date)
);

create index if not exists coach_practice_plans_athlete_date_idx
  on public.coach_practice_plans(athlete_account_id, date);

alter table public.coach_practice_plans enable row level security;

drop policy if exists coach_practice_plans_select on public.coach_practice_plans;
create policy coach_practice_plans_select on public.coach_practice_plans
  for select to authenticated using (
    coach_account_id = auth.uid()
    or athlete_account_id = auth.uid()
    or public.is_connected_to_athlete(athlete_account_id)
  );

drop policy if exists coach_practice_plans_insert on public.coach_practice_plans;
create policy coach_practice_plans_insert on public.coach_practice_plans
  for insert to authenticated with check (
    coach_account_id = auth.uid()
    and exists (
      select 1 from public.accounts a
      where a.id = auth.uid() and a.role = 'coach'
    )
    and exists (
      select 1 from public.connections c
      where c.athlete_account_id = coach_practice_plans.athlete_account_id
        and c.other_account_id = auth.uid()
        and c.status = 'accepted'
    )
  );

drop policy if exists coach_practice_plans_update on public.coach_practice_plans;
create policy coach_practice_plans_update on public.coach_practice_plans
  for update to authenticated
  using (coach_account_id = auth.uid())
  with check (coach_account_id = auth.uid());

drop policy if exists coach_practice_plans_delete on public.coach_practice_plans;
create policy coach_practice_plans_delete on public.coach_practice_plans
  for delete to authenticated using (coach_account_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. Per-item completion state
-- ---------------------------------------------------------------------------
create table if not exists public.coach_practice_plan_completions (
  plan_id uuid not null references public.coach_practice_plans(id) on delete cascade,
  item_id text not null,
  athlete_account_id uuid not null references public.accounts(id) on delete cascade,
  xp_awarded int not null default 0 check (xp_awarded >= 0),
  completed_at timestamptz not null default now(),
  primary key (plan_id, item_id, athlete_account_id)
);

alter table public.coach_practice_plan_completions enable row level security;

-- SELECT — athlete self, connected adults (coach/parent), and the plan's author.
drop policy if exists coach_practice_plan_completions_select on public.coach_practice_plan_completions;
create policy coach_practice_plan_completions_select on public.coach_practice_plan_completions
  for select to authenticated using (
    athlete_account_id = auth.uid()
    or public.is_connected_to_athlete(athlete_account_id)
    or exists (
      select 1 from public.coach_practice_plans p
      where p.id = plan_id and p.coach_account_id = auth.uid()
    )
  );

-- INSERT — athlete ticks their own item off a plan that targets them.
drop policy if exists coach_practice_plan_completions_insert on public.coach_practice_plan_completions;
create policy coach_practice_plan_completions_insert on public.coach_practice_plan_completions
  for insert to authenticated with check (
    athlete_account_id = auth.uid()
    and exists (
      select 1 from public.coach_practice_plans p
      where p.id = plan_id and p.athlete_account_id = auth.uid()
    )
  );

-- DELETE — athlete can un-check their own items.
drop policy if exists coach_practice_plan_completions_delete on public.coach_practice_plan_completions;
create policy coach_practice_plan_completions_delete on public.coach_practice_plan_completions
  for delete to authenticated using (athlete_account_id = auth.uid());

-- Realtime so the athlete's checklist updates the moment the coach pushes,
-- and so the coach (future: see completion progress) gets live updates.
do $$
begin
  alter publication supabase_realtime add table public.coach_practice_plans;
exception
  when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.coach_practice_plan_completions;
exception
  when duplicate_object then null;
end $$;
