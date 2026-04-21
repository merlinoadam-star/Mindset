-- ============================================================================
-- Streak freezes — sync athlete's used freeze dates to the cloud.
--
-- The athlete app lets kids "spend" a streak-freeze token to save a
-- missed day so their streak survives. Before this change, the list
-- of used-freeze dates was local-only, which meant the coach roster
-- recomputed streak from raw activity rows and DIDN'T see the freezes
-- — a kid who froze yesterday would look like their streak broke from
-- the coach's side even though the athlete app correctly counted the
-- freeze as a save.
--
-- We store the dates as a plain text[] of YYYY-MM-DD strings — the
-- smallest surface area that matches how the athlete stores them
-- locally, and trivially readable by the roster query that joins it
-- into the activity-dates set.
--
-- Run once in Supabase SQL Editor. Idempotent (safe to re-run).
-- ============================================================================

alter table public.athletes
  add column if not exists used_freeze_dates text[] not null default '{}';

-- No index needed — this column is read as part of the same roster-wide
-- SELECT that already fetches `athletes.xp` by id list.
