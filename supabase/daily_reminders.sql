-- ============================================================================
-- Mindset — Phase 3C.4: daily reminder columns on accounts
-- Run this once in Supabase SQL Editor.
--
-- Each athlete can opt into a daily reminder push at a chosen local
-- hour. The edge function `send-reminders` runs hourly via pg_cron,
-- checks each opted-in account's local hour, and fires a push if the
-- athlete hasn't logged anything today in their timezone.
-- ============================================================================

alter table public.accounts
  add column if not exists daily_reminder_enabled boolean default false;

alter table public.accounts
  add column if not exists daily_reminder_hour integer default 18
  check (daily_reminder_hour between 0 and 23);

alter table public.accounts
  add column if not exists daily_reminder_timezone text default 'UTC';

-- The "accounts update own" policy from notification_prefs.sql already
-- permits the user to write these columns, so no extra policy needed.
