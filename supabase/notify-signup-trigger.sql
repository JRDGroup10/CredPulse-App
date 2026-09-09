-- Notifies the app owner by email whenever a new user signs up.
-- Run this once in your Supabase SQL Editor AFTER deploying the
-- notify-signup Edge Function and setting its secrets.
--
-- Before running: replace the two placeholders below —
--   YOUR_PROJECT_REF -> from Project Settings -> General -> Reference ID
--   YOUR_PUBLIC_KEY  -> from Project Settings -> API -> anon/publishable key (NOT secret)
--
-- Use the anon/publishable key here, not the service_role key. The
-- notify-signup Edge Function is deployed with --no-verify-jwt and doesn't
-- check the incoming Authorization header for anything, so this call
-- doesn't need — and shouldn't carry — a key that can bypass RLS. An
-- earlier version of this file called for the service_role key out of
-- habit (copying cron.sql, which genuinely needs it), which left a
-- full-privilege secret sitting in plaintext inside this Postgres function
-- for no functional reason. The anon/publishable key is safe to have here
-- since it's already public in the shipped frontend bundle.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_admin_of_signup()
returns trigger as $$
begin
  perform
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-signup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_PUBLIC_KEY'
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
