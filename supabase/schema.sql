-- CredPulse database schema.
-- Run this once in your Supabase project's SQL Editor (Project -> SQL Editor -> New query),
-- then click Run. Safe to re-run — every statement is idempotent.

-- ============================================================
-- profiles: one row per user, extends Supabase's built-in auth.users
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  role text not null default '',
  email text not null default '',
  plan text not null default 'free' check (plan in ('free', 'plus', 'pro')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'yearly')),
  region text not null default 'CA' check (region in ('CA', 'US')),
  reminder_days int[] not null default '{90,30,7}',
  created_at timestamptz not null default now()
);

-- Safe to re-run against a project that already had this table before
-- "region" existed — adds the column without touching existing rows.
alter table public.profiles add column if not exists region text not null default 'CA';
alter table public.profiles drop constraint if exists profiles_region_check;
alter table public.profiles add constraint profiles_region_check check (region in ('CA', 'US'));

-- Stripe customer id, set by the stripe-webhook Edge Function once a user
-- completes checkout for the first time. Used to match incoming Stripe
-- webhook events (cancellations, plan changes) back to the right user.
alter table public.profiles add column if not exists stripe_customer_id text;

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create a profile row the moment someone signs up, so the app
-- never has to handle "authenticated but no profile row exists yet".
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, region)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', ''),
    coalesce(new.raw_user_meta_data->>'region', 'CA')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- certificates: one row per tracked credential
-- ============================================================
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  issuer text not null default '',
  credential_type text not null default 'certification',
  issued_date date,
  expiry_date date not null,
  file_path text,
  tip text,
  renewal_url text,
  created_at timestamptz not null default now()
);

alter table public.certificates enable row level security;

drop policy if exists "Users can view own certificates" on public.certificates;
create policy "Users can view own certificates" on public.certificates
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own certificates" on public.certificates;
create policy "Users can insert own certificates" on public.certificates
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own certificates" on public.certificates;
create policy "Users can update own certificates" on public.certificates
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own certificates" on public.certificates;
create policy "Users can delete own certificates" on public.certificates
  for delete using (auth.uid() = user_id);

-- ============================================================
-- storage: private bucket for uploaded certificate files
-- Files are stored under a path like "<user_id>/<filename>" so the
-- policies below can scope access to each user's own folder.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload own cert files" on storage.objects;
create policy "Users can upload own cert files" on storage.objects
  for insert with check (
    bucket_id = 'certificates' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can view own cert files" on storage.objects;
create policy "Users can view own cert files" on storage.objects
  for select using (
    bucket_id = 'certificates' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own cert files" on storage.objects;
create policy "Users can delete own cert files" on storage.objects
  for delete using (
    bucket_id = 'certificates' and (storage.foldername(name))[1] = auth.uid()::text
  );
