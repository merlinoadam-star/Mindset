-- ============================================================================
-- Mindset — Phase 3C.4: schedule the send-reminders edge function hourly
-- Run this once in Supabase SQL Editor AFTER deploying the send-reminders
-- edge function AND enabling the pg_cron + pg_net extensions.
--
-- BEFORE RUNNING: edit the two placeholders below
--   <YOUR-PROJECT-REF>     — from your Supabase URL (the subdomain part)
--   <YOUR-SERVICE-ROLE-KEY> — Supabase Settings → API → service_role key
--                            (long eyJ... token; KEEP THIS SECRET)
-- ============================================================================

-- Schedule the function to run at minute 0 of every hour
select
  cron.schedule(
    'mindset-daily-reminders',
    '0 * * * *',
    $$
    select net.http_post(
      url := 'https://<YOUR-PROJECT-REF>.supabase.co/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <YOUR-SERVICE-ROLE-KEY>'
      ),
      body := '{}'::jsonb
    ) as request_id;
    $$
  );

-- To stop the job later:
--   select cron.unschedule('mindset-daily-reminders');
--
-- To see scheduled jobs:
--   select * from cron.job;
--
-- To see recent runs:
--   select * from cron.job_run_details order by start_time desc limit 20;
