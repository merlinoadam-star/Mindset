-- ============================================================================
-- Mindset — schedule the send-weekly-digest edge function.
-- Run this once in Supabase SQL Editor AFTER deploying the function AND
-- enabling the pg_cron + pg_net extensions.
--
-- BEFORE RUNNING: edit the two placeholders below
--   <YOUR-PROJECT-REF>     — from your Supabase URL (the subdomain part)
--   <YOUR-SERVICE-ROLE-KEY> — Supabase Settings → API → service_role key
--                             (long eyJ... token; KEEP THIS SECRET)
--
-- The edge function itself gates on local weekday/hour per recipient, so
-- we simply run it hourly. Each coach/parent gets one email per week,
-- timed to their local Sunday ~19:00. Dedup is enforced server-side via
-- accounts.last_weekly_digest_at.
-- ============================================================================

-- Step 1 — add the dedup column if missing
alter table public.accounts
  add column if not exists last_weekly_digest_at timestamptz;

-- Step 2 — schedule the hourly cron job
select
  cron.schedule(
    'mindset-weekly-digest',
    '0 * * * *',
    $$
    select net.http_post(
      url := 'https://<YOUR-PROJECT-REF>.supabase.co/functions/v1/send-weekly-digest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <YOUR-SERVICE-ROLE-KEY>'
      ),
      body := '{}'::jsonb
    ) as request_id;
    $$
  );

-- To stop the job later:
--   select cron.unschedule('mindset-weekly-digest');
--
-- To see scheduled jobs:
--   select * from cron.job;
--
-- To fire a digest manually for testing (ignores weekday/hour gates):
--   Hit: https://<YOUR-PROJECT-REF>.supabase.co/functions/v1/send-weekly-digest?force=1
--   With Authorization: Bearer <YOUR-SERVICE-ROLE-KEY>
--
-- To only test for one recipient:
--   ?force=1&recipient=<account-id>
