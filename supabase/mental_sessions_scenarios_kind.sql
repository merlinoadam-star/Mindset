-- ============================================================================
-- mental_sessions — allow `kind = 'scenarios'`
--
-- The Scenarios game (Decision Drill) writes mental_sessions rows with
-- kind = 'scenarios', but the original CHECK constraint only allowed
-- ('visualization', 'breathing', 'lesson'). Postgres rejected the whole
-- upsert batch the moment any 'scenarios' row was included, so the
-- table stayed empty for any athlete who'd ever played the game — the
-- coach roster had no mindset activity to count, and streaks/activity
-- on the coach side silently broke.
--
-- Run once in Supabase SQL Editor. Idempotent (drops + re-creates the
-- constraint).
-- ============================================================================

alter table public.mental_sessions
  drop constraint if exists mental_sessions_kind_check;

alter table public.mental_sessions
  add constraint mental_sessions_kind_check
  check (kind in ('visualization', 'breathing', 'lesson', 'scenarios'));
