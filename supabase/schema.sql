-- ============================================================================
-- Mindset — Phase 2 Schema
-- Paste this into Supabase → SQL Editor → New query → Run.
-- Safe to re-run (uses IF NOT EXISTS where possible). Idempotent.
-- ============================================================================

-- -------------------------------------------------------------------------
-- 1. accounts — one row per signed-in user, linked to auth.users
-- -------------------------------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null check (role in ('athlete', 'coach', 'parent')),
  avatar_emoji text,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- 2. athletes — denormalized athlete profile (same fields as local state)
--    One per athlete account. Coaches/parents don't get rows here.
-- -------------------------------------------------------------------------
create table if not exists public.athletes (
  id uuid primary key references public.accounts(id) on delete cascade,
  name text not null,
  last_name text,
  sport text not null check (sport in ('wrestling', 'volleyball')),
  age int not null,
  grade text not null,
  gender text,
  height_inches int,
  weight_lbs int,
  years_playing int,
  team_name text,
  coach_name text,
  jersey_number text,
  hometown text,
  weight_class int,
  wrestling_styles text[],
  primary_position text,
  secondary_position text,
  dominant_hand text,
  vertical_jump_inches int,
  approach_jump_inches int,
  goals jsonb,
  wrestling_stats jsonb,
  volleyball_stats jsonb,
  xp int not null default 0,
  voice_persona_id text default 'natural',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- 3. connections — athlete ↔ coach/parent links
-- -------------------------------------------------------------------------
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  athlete_account_id uuid not null references public.accounts(id) on delete cascade,
  other_account_id uuid not null references public.accounts(id) on delete cascade,
  initiated_by text not null check (initiated_by in ('athlete', 'coach', 'parent')),
  connected_role text not null check (connected_role in ('coach', 'parent')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  note text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  -- Prevent duplicate active connections
  unique (athlete_account_id, other_account_id, connected_role)
);

create index if not exists connections_athlete_idx on public.connections(athlete_account_id);
create index if not exists connections_other_idx on public.connections(other_account_id);

-- -------------------------------------------------------------------------
-- 4. Data tables — everything an athlete owns. Sync targets for Phase 2B.
--    All scoped by athlete_id (which is the athlete's account id).
-- -------------------------------------------------------------------------

create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  habit_id text not null,
  date date not null,
  completed_at timestamptz not null default now(),
  unique (athlete_id, habit_id, date)
);

create table if not exists public.practices (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  date date not null,
  duration_min int not null,
  type text not null,
  intensity int not null check (intensity between 1 and 5),
  notes text,
  drills text[],
  xp_earned int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.opponents (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  first_name text,
  last_name text not null,
  team_name text,
  state text,
  coach_name text,
  weight_class text,
  position text,
  grade text,
  jersey_number text,
  strategy_notes text,
  general_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  date date not null,
  opponent text,
  opponent_id uuid references public.opponents(id) on delete set null,
  event text,
  location text,
  focus_objective text,
  execute_this text,
  mental_state_before int,
  visualization_note text,
  pre_match_completed_at timestamptz,
  result text check (result in ('win', 'loss', 'tie')),
  wrestling jsonb,
  volleyball jsonb,
  performance_rating int,
  went_well text,
  could_be_better text,
  next_focus text,
  gratitude text,
  lesson_learned text,
  post_match_completed_at timestamptz,
  xp_earned int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.mental_checkins (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  date date not null,
  mood int not null,
  gratitude text,
  goal text,
  goal_met boolean,
  goal_review_note text,
  goal_reviewed_at timestamptz,
  xp_earned int not null default 0,
  unique (athlete_id, date)
);

create table if not exists public.mental_sessions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  kind text not null check (kind in ('visualization', 'breathing', 'lesson')),
  ref_id text not null,
  date date not null,
  completed_at timestamptz not null default now(),
  xp_earned int not null default 0
);

create table if not exists public.recovery_checkins (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  date date not null,
  sleep_hours numeric,
  sleep_quality int,
  soreness int,
  energy int,
  notes text,
  xp_earned int not null default 0,
  unique (athlete_id, date)
);

create table if not exists public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  date date not null,
  ate_breakfast boolean,
  ate_lunch boolean,
  ate_dinner boolean,
  ate_snacks boolean,
  had_protein boolean,
  had_fruit_veg boolean,
  had_whole_grains boolean,
  had_healthy_fats boolean,
  pre_workout_fuel boolean,
  post_workout_fuel boolean,
  water_glasses int,
  proud_of text,
  notes text,
  xp_earned int not null default 0,
  unique (athlete_id, date)
);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  week_start_date date not null,
  wins text[] not null default '{}',
  challenge text,
  learned text,
  next_week_goal text,
  xp_earned int not null default 0,
  created_at timestamptz not null default now(),
  unique (athlete_id, week_start_date)
);

create table if not exists public.power_phrases (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  text text not null,
  is_pinned boolean not null default false,
  times_used int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  uploader_account_id uuid not null references public.accounts(id),
  title text not null,
  description text,
  tag text not null,
  duration_sec numeric,
  thumbnail_data_url text,
  storage_path text,
  mime_type text not null,
  size_bytes bigint not null,
  author text,
  audience text,
  self_notes text,
  marked_for_review boolean default false,
  reviewed_at timestamptz,
  reviewer_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  name text not null,
  year int not null,
  result text,
  type text,
  date date
);

create table if not exists public.awards (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  name text not null,
  year int not null,
  note text
);

create table if not exists public.unlocked_badges (
  id text not null,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (athlete_id, id)
);

-- -------------------------------------------------------------------------
-- 5. Row Level Security (RLS)
--    Athletes can read/write their own data. Coaches and parents can read
--    the data of athletes they have an accepted connection with (and,
--    for coaches, write videos + match feedback).
-- -------------------------------------------------------------------------

alter table public.accounts enable row level security;
alter table public.athletes enable row level security;
alter table public.connections enable row level security;
alter table public.habit_completions enable row level security;
alter table public.practices enable row level security;
alter table public.matches enable row level security;
alter table public.opponents enable row level security;
alter table public.mental_checkins enable row level security;
alter table public.mental_sessions enable row level security;
alter table public.recovery_checkins enable row level security;
alter table public.nutrition_logs enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.power_phrases enable row level security;
alter table public.videos enable row level security;
alter table public.tournaments enable row level security;
alter table public.awards enable row level security;
alter table public.unlocked_badges enable row level security;

-- accounts: everyone reads their own. Other accounts are visible only if
-- they're connected to you or you're searching by exact email (for invites).
drop policy if exists "own account read" on public.accounts;
create policy "own account read" on public.accounts
  for select using (auth.uid() = id);

drop policy if exists "own account write" on public.accounts;
create policy "own account write" on public.accounts
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Helper function: is current user connected to this athlete?
create or replace function public.is_connected_to_athlete(aid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.connections c
    where c.athlete_account_id = aid
      and c.other_account_id = auth.uid()
      and c.status = 'accepted'
  );
$$;

-- athletes: self + connected coaches/parents
drop policy if exists "athlete read" on public.athletes;
create policy "athlete read" on public.athletes
  for select using (
    auth.uid() = id
    or public.is_connected_to_athlete(id)
  );

drop policy if exists "athlete write" on public.athletes;
create policy "athlete write" on public.athletes
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- connections: either party can see or modify
drop policy if exists "connection read" on public.connections;
create policy "connection read" on public.connections
  for select using (
    auth.uid() = athlete_account_id or auth.uid() = other_account_id
  );

drop policy if exists "connection insert" on public.connections;
create policy "connection insert" on public.connections
  for insert with check (
    auth.uid() = athlete_account_id or auth.uid() = other_account_id
  );

drop policy if exists "connection update" on public.connections;
create policy "connection update" on public.connections
  for update using (
    auth.uid() = athlete_account_id or auth.uid() = other_account_id
  );

drop policy if exists "connection delete" on public.connections;
create policy "connection delete" on public.connections
  for delete using (
    auth.uid() = athlete_account_id or auth.uid() = other_account_id
  );

-- Generic policy builder for athlete-owned tables: athlete r/w, connected r
do $$
declare t text;
begin
  foreach t in array array[
    'habit_completions','practices','matches','opponents','mental_checkins',
    'mental_sessions','recovery_checkins','nutrition_logs','weekly_reviews',
    'power_phrases','tournaments','awards','unlocked_badges'
  ]
  loop
    execute format('drop policy if exists "%s_read" on public.%I', t, t);
    execute format(
      'create policy "%s_read" on public.%I for select using ('
      'auth.uid() = athlete_id or public.is_connected_to_athlete(athlete_id))',
      t, t
    );
    execute format('drop policy if exists "%s_write" on public.%I', t, t);
    execute format(
      'create policy "%s_write" on public.%I for all using ('
      'auth.uid() = athlete_id) with check (auth.uid() = athlete_id)',
      t, t
    );
  end loop;
end $$;

-- Videos have a special rule: the uploader (coach or athlete) can write.
drop policy if exists "videos_read" on public.videos;
create policy "videos_read" on public.videos
  for select using (
    auth.uid() = athlete_id
    or auth.uid() = uploader_account_id
    or public.is_connected_to_athlete(athlete_id)
  );

drop policy if exists "videos_write" on public.videos;
create policy "videos_write" on public.videos
  for all using (
    auth.uid() = uploader_account_id
    or auth.uid() = athlete_id
  ) with check (
    auth.uid() = uploader_account_id
    or auth.uid() = athlete_id
  );
