-- Schedules the send-monthly-digest Edge Function to run once a month.
-- Run this once in your Supabase SQL Editor AFTER deploying
-- send-monthly-digest. This is separate from cron.sql (the daily reminder
-- job) so the two schedules can be managed independently.
--
-- Before running: replace the two placeholders below —
--   YOUR-PROJECT-REF      -> from Project Settings -> General -> Reference ID
--   YOUR-SERVICE-ROLE-KEY -> from Project Settings -> API -> service_role key (SECRET, never put this in frontend code)
--
-- This only ever lives inside your Supabase project's Postgres — it's fine
-- for it to reference the service role key here.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select
  cron.schedule(
    'send-monthly-digest',
    '0 13 1 * *', -- 13:00 UTC on the 1st of each month (~9am Eastern) — adjust to taste
    $$
    select
      net.http_post(
        url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-monthly-digest',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer YOUR-SERVICE-ROLE-KEY'
        ),
        body := '{}'::jsonb
      );
    $$
  );

-- To check it's scheduled:
--   select * from cron.job;
-- To remove it later:
--   select cron.unschedule('send-monthly-digest');
