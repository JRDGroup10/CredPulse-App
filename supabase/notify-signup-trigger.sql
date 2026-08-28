-- Notifies the app owner by email whenever a new user signs up.
-- Run this once in your Supabase SQL Editor AFTER deploying the
-- notify-signup Edge Function and setting its secrets.
--
-- Before running: replace the two placeholders below —
--   YOUR_PROJECT_REF      -> from Project Settings -> General -> Reference ID
--   YOUR_SERVICE_ROLE_KEY -> from Project Settings -> API -> service_role key (SECRET)
--
-- This only ever lives inside your Supabase project's Postgres — it's fine
-- for it to reference the service role key here, same as cron.sql. Just
-- don't commit the filled-in version to git (this file should always show
-- placeholders, not the real key).

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_admin_of_signup()
returns trigger as $$
begin
  perform
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-signup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := jsonb_build_object(
        'name', new.name,
        'email', new.email,
        'role', new.role,
        'region', new.region
      )
    );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_profile_created_notify_admin on public.profiles;
create trigger on_profile_created_notify_admin
  after insert on public.profiles
  for each row execute procedure public.notify_admin_of_signup();

-- To check it's installed:
--   select tgname from pg_trigger where tgname = 'on_profile_created_notify_admin';
-- To remove this later:
--   drop trigger on_profile_created_notify_admin on public.profiles;
