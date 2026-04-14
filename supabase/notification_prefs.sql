-- ============================================================================
-- Mindset — Phase 3B.5: per-user notification preferences
-- Run this once in Supabase SQL Editor.
--
-- Adds a notification_prefs JSONB column to accounts. Stores a flat
-- object of pref-key → boolean (true = send, false = suppress). Keys
-- in use:
--   notes         coach/parent notes on matches, videos, practices
--   cheers        one-tap encouragement from coach/parent
--   weeklyFocus   coach/parent sets a new weekly focus
--   milestones    athlete level-ups + streak milestones (to coach/parent)
--
-- Missing keys default to ON in the edge function, so this migration
-- is safe to roll out incrementally.
-- ============================================================================

alter table public.accounts
  add column if not exists notification_prefs jsonb
  default '{"notes": true, "cheers": true, "weeklyFocus": true, "milestones": true}'::jsonb;

-- Ensure existing rows have the default populated (the DEFAULT only
-- fills on future inserts).
update public.accounts
set notification_prefs = '{"notes": true, "cheers": true, "weeklyFocus": true, "milestones": true}'::jsonb
where notification_prefs is null;

-- Let a user update their own account row (needed so the Settings UI
-- can toggle prefs). Without this, RLS blocks self-updates.
drop policy if exists "accounts update own" on public.accounts;
create policy "accounts update own" on public.accounts
  for update using (auth.uid() = id) with check (auth.uid() = id);
