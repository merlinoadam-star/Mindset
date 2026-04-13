-- ============================================================================
-- Mindset — Phase 2D: enable Realtime on the sync tables
-- Run this once in Supabase SQL Editor. Safe to re-run (idempotent).
--
-- Adds every synced table to the `supabase_realtime` publication so
-- WebSocket subscribers receive INSERT / UPDATE / DELETE events.
-- ============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'accounts', 'athletes', 'connections', 'feedback',
    'matches', 'practices', 'habit_completions', 'opponents',
    'mental_checkins', 'mental_sessions', 'recovery_checkins',
    'nutrition_logs', 'weekly_reviews', 'power_phrases',
    'tournaments', 'awards', 'unlocked_badges', 'videos'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;  -- already part of the publication
      when undefined_table then null;   -- table doesn't exist yet — skip
    end;
  end loop;
end $$;
