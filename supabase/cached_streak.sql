-- ============================================================================
-- Cached streak on athletes — the coach roster reads what the athlete's
-- own app most recently computed instead of recomputing from raw activity
-- rows every time.
--
-- Why: recomputing from raw rows has been the source of every coach-vs-
-- athlete streak disagreement this month. A single missing row — whether
-- because a sync batch failed, a migration hadn't run, or an activity
-- type wasn't on the coach's read list — silently broke the streak from
-- the coach's view even though the athlete's local app had the right
-- answer the whole time. Caching the athlete's computed value and
-- reading it back removes that entire class of bug.
--
-- How it's used:
--   - Athlete app writes `current_streak` + `streak_updated_at` as part
--     of the existing profile-sync effect, whenever their local state
--     changes (state.xp / state.habitCompletions / state.matches / etc.).
--   - Coach fetchTeamStats reads current_streak directly and uses it
--     when streak_updated_at is within the last 24h. Otherwise it falls
--     back to recomputing from raw rows (handles athletes who haven't
--     opened the app in a while and whose cached value is stale).
--
-- Defaults:
--   - current_streak defaults to 0 for backfill — the athlete's next
--     profile sync will overwrite it with the real value.
--   - streak_updated_at is nullable so we can tell "never reported" vs
--     "reported zero."
--
-- Run once in Supabase SQL Editor. Idempotent (safe to re-run).
-- ============================================================================

alter table public.athletes
  add column if not exists current_streak int not null default 0;

alter table public.athletes
  add column if not exists streak_updated_at timestamptz;
