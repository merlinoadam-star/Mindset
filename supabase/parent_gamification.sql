-- ============================================================================
-- Mindset — Parent gamification
--
-- Parents earn XP for supporting their athlete — check-ins, playbook actions,
-- cheers. When a parent acts on a day the athlete also acted, BOTH sides
-- earn a small combo bonus.
--
-- Storage model:
--   parent_actions       — ledger row per parent action per day (idempotent
--                          via unique (parent, athlete, action, date))
--   athlete_xp_gifts     — one row per combo gift to an athlete; used to
--                          show the athlete a toast ("nice combo, +5 XP")
--                          on their next load
--   grant_athlete_combo_xp(...) — security-definer RPC; adds xp directly to
--                          athletes.xp and logs the gift. Only a connected
--                          coach/parent can call it.
--
-- The athlete's local XP reconciles with the cloud via Math.max on
-- hydration (see store.tsx), so a direct write to athletes.xp will
-- surface once the athlete next opens the app.
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. parent_actions — ledger
-- ---------------------------------------------------------------------------
create table if not exists public.parent_actions (
  id uuid primary key default gen_random_uuid(),
  parent_account_id uuid not null references public.accounts(id) on delete cascade,
  athlete_account_id uuid not null references public.accounts(id) on delete cascade,
  action_type text not null check (action_type in ('check_in', 'playbook', 'cheer', 'daily_review')),
  date date not null,
  xp_earned int not null check (xp_earned >= 0),
  combo boolean not null default false,
  combo_xp int not null default 0 check (combo_xp >= 0),
  created_at timestamptz not null default now(),
  unique (parent_account_id, athlete_account_id, action_type, date)
);

create index if not exists parent_actions_parent_idx
  on public.parent_actions(parent_account_id, date desc);

alter table public.parent_actions enable row level security;

drop policy if exists parent_actions_select on public.parent_actions;
create policy parent_actions_select
  on public.parent_actions
  for select
  to authenticated
  using (parent_account_id = auth.uid());

drop policy if exists parent_actions_insert on public.parent_actions;
create policy parent_actions_insert
  on public.parent_actions
  for insert
  to authenticated
  with check (
    parent_account_id = auth.uid()
    and exists (
      select 1 from public.connections c
      where c.athlete_account_id = parent_actions.athlete_account_id
        and c.other_account_id = auth.uid()
        and c.status = 'accepted'
    )
  );

-- ---------------------------------------------------------------------------
-- 2. athlete_xp_gifts — one row per combo XP gift given to an athlete
-- ---------------------------------------------------------------------------
create table if not exists public.athlete_xp_gifts (
  id uuid primary key default gen_random_uuid(),
  athlete_account_id uuid not null references public.accounts(id) on delete cascade,
  from_account_id uuid not null references public.accounts(id) on delete cascade,
  from_role text not null check (from_role in ('coach', 'parent')),
  xp int not null check (xp > 0),
  reason text not null,
  seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists athlete_xp_gifts_unseen_idx
  on public.athlete_xp_gifts(athlete_account_id, created_at desc)
  where seen_at is null;

alter table public.athlete_xp_gifts enable row level security;

-- Athlete can read their own gifts; sender can read ones they sent.
drop policy if exists athlete_xp_gifts_select on public.athlete_xp_gifts;
create policy athlete_xp_gifts_select
  on public.athlete_xp_gifts
  for select
  to authenticated
  using (
    athlete_account_id = auth.uid()
    or from_account_id = auth.uid()
  );

-- Athlete can mark their own gifts as seen (only seen_at update).
drop policy if exists athlete_xp_gifts_update on public.athlete_xp_gifts;
create policy athlete_xp_gifts_update
  on public.athlete_xp_gifts
  for update
  to authenticated
  using (athlete_account_id = auth.uid())
  with check (athlete_account_id = auth.uid());

-- No direct INSERT policy — all writes go through grant_athlete_combo_xp
-- RPC below. That keeps the "add to athletes.xp AND log gift" step atomic
-- and behind a permission check.

-- ---------------------------------------------------------------------------
-- 3. RPC — grant_athlete_combo_xp
--
-- Caller: a connected coach or parent. Effect: adds p_xp to the target
-- athlete's athletes.xp column and records a gift row the athlete will
-- see on their next app load.
-- ---------------------------------------------------------------------------
create or replace function public.grant_athlete_combo_xp(
  p_athlete uuid,
  p_xp int,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $func$
begin
  if p_xp is null or p_xp <= 0 or p_xp > 50 then
    raise exception 'xp out of range';
  end if;

  -- Caller must have an accepted connection to the athlete.
  if not exists (
    select 1 from public.connections c
    where c.athlete_account_id = p_athlete
      and c.other_account_id = auth.uid()
      and c.status = 'accepted'
  ) then
    raise exception 'not connected to athlete';
  end if;

  -- Bump the athlete's cloud XP. Their client reconciles local vs cloud
  -- via Math.max on next hydration, so this surfaces on next app open.
  update public.athletes
     set xp = coalesce(xp, 0) + p_xp,
         updated_at = now()
   where id = p_athlete;

  -- Log the gift, pulling the caller's role from the connection row
  -- inline so we don't need a local variable.
  insert into public.athlete_xp_gifts (
    athlete_account_id,
    from_account_id,
    from_role,
    xp,
    reason
  )
  select
    p_athlete,
    auth.uid(),
    c.connected_role,
    p_xp,
    p_reason
  from public.connections c
  where c.athlete_account_id = p_athlete
    and c.other_account_id = auth.uid()
    and c.status = 'accepted'
  limit 1;
end;
$func$;

revoke all on function public.grant_athlete_combo_xp(uuid, int, text) from public;
grant execute on function public.grant_athlete_combo_xp(uuid, int, text) to authenticated;
