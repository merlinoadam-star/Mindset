-- ============================================================================
-- Mindset — Team Weekly Leaderboard
--
-- One row per (athlete, ISO-Monday) tracking XP earned from mini-games
-- (trivia, scenarios, reaction tap, focus flash, play call) this week.
-- Coaches / parents read for athletes they're connected to; athletes
-- increment their own row via the add_weekly_game_xp RPC.
--
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================

create table if not exists public.athlete_weekly_game_xp (
  athlete_account_id uuid not null references public.accounts(id) on delete cascade,
  week_iso text not null,   -- YYYY-MM-DD Monday of the ISO week
  xp int not null default 0 check (xp >= 0),
  updated_at timestamptz not null default now(),
  primary key (athlete_account_id, week_iso)
);

create index if not exists athlete_weekly_game_xp_week_idx
  on public.athlete_weekly_game_xp(week_iso, athlete_account_id);

alter table public.athlete_weekly_game_xp enable row level security;

-- SELECT — athlete reads own rows; a connected coach/parent reads
-- rows for any athlete they have an accepted connection with.
drop policy if exists athlete_weekly_game_xp_select on public.athlete_weekly_game_xp;
create policy athlete_weekly_game_xp_select
  on public.athlete_weekly_game_xp
  for select
  to authenticated
  using (
    athlete_account_id = auth.uid()
    or public.is_connected_to_athlete(athlete_account_id)
  );

-- No direct INSERT / UPDATE policies — writes go through the RPC
-- below so we can safely `xp + excluded.xp` without letting a
-- malicious client overwrite totals with an arbitrary value.

-- Increments this week's XP counter for the calling athlete.
-- Caller must be an athlete. p_week is the client's computed
-- Monday ISO (YYYY-MM-DD) so timezone discrepancies don't put
-- Sunday-night sessions into the wrong week.
create or replace function public.add_weekly_game_xp(
  p_week text,
  p_xp int
)
returns void
language plpgsql
security definer
set search_path = public
as $func$
begin
  if p_xp is null or p_xp <= 0 then
    return;
  end if;

  -- Caller must exist and be an athlete.
  if not exists (
    select 1 from public.accounts
    where id = auth.uid() and role = 'athlete'
  ) then
    raise exception 'only athletes can record weekly game xp';
  end if;

  insert into public.athlete_weekly_game_xp (
    athlete_account_id, week_iso, xp
  ) values (
    auth.uid(), p_week, p_xp
  )
  on conflict (athlete_account_id, week_iso)
  do update set
    xp = public.athlete_weekly_game_xp.xp + excluded.xp,
    updated_at = now();
end;
$func$;

revoke all on function public.add_weekly_game_xp(text, int) from public;
grant execute on function public.add_weekly_game_xp(text, int) to authenticated;
