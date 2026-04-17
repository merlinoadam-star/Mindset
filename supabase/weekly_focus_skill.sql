-- ============================================================================
-- Mindset — add optional skill_id to weekly_focus.
--
-- When a coach picks a skill from the catalog, the skill_id is stored
-- alongside the free-text focus. The athlete's dashboard renders a
-- nicer card (emoji, color, blurb) when skill_id is present. Free-text
-- focuses still work exactly like before (skill_id will be null).
--
-- Run once in Supabase SQL Editor. Idempotent (safe to re-run).
-- ============================================================================

alter table public.weekly_focus
  add column if not exists skill_id text;

-- No index needed — we always fetch by athlete_id + week_start_date
-- (already indexed via the unique constraint).
