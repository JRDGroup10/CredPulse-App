-- Team/Clinic compliance dashboard — organizations, membership, and invites.
--
-- Design choice: there is no separate "clinic signup" flow. Any existing
-- user can create a team from Settings and becomes its 'owner'; anyone they
-- invite by email joins as 'member' the moment they sign up (handled
-- automatically below) or, if they already have a CredPulse account,
-- by accepting the invite from within the app. 'admin' is reserved for a
-- future "add a co-admin" action — nothing sets it yet.
--
-- Run this once in your Supabase project's SQL Editor. Safe to re-run.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- Membership fields on profiles. organization_id is nullable — most users
-- will never belong to one, and that's the expected default.
alter table public.profiles add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.profiles add column if not exists org_role text not null default 'member';
alter table public.profiles drop constraint if exists profiles_org_role_check;
alter table public.profiles add constraint profiles_org_role_check check (org_role in ('owner', 'admin', 'member'));

-- Invites are stored by email, not user_id, because the invited person may
-- not have an account yet.
create table if not exists public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table public.organization_invites enable row level security;

-- ============================================================
-- Helper: is the current user an owner/admin of the given org?
-- SECURITY DEFINER so it reads profiles without triggering the RLS
-- policies below on that same read (avoids "infinite recursion detected
-- in policy", a common gotcha with self-referencing profile policies).
-- ============================================================
create or replace function public.is_org_admin(check_org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and organization_id = check_org_id
      and org_role in ('owner', 'admin')
  );
$$ language sql security definer stable set search_path = public;

-- ============================================================
-- organizations policies
-- ============================================================
drop policy if exists "Members can view their own organization" on public.organizations;
create policy "Members can view their own organization" on public.organizations
  for select using (
    id = (select organization_id from public.profiles where id = auth.uid())
  );

drop policy if exists "Owners can update their organization" on public.organizations;
create policy "Owners can update their organization" on public.organizations
  for update using (owner_id = auth.uid());

drop policy if exists "Any signed-in user can create an organization" on public.organizations;
create policy "Any signed-in user can create an organization" on public.organizations
  for insert with check (owner_id = auth.uid());

-- ============================================================
-- profiles: let org admins see (read-only) their teammates' profiles.
-- This ADDS to the existing "Users can view own profile" policy from
-- schema.sql — it doesn't replace it, everyone can still see their own row.
-- ============================================================
drop policy if exists "Org admins can view member profiles" on public.profiles;
create policy "Org admins can view member profiles" on public.profiles
  for select using (
    organization_id is not null and public.is_org_admin(organization_id)
  );

-- ============================================================
-- certificates: let org admins see (read-only) their teammates'
-- certificates — this is the actual data the manager dashboard displays.
-- ============================================================
drop policy if exists "Org admins can view member certificates" on public.certificates;
create policy "Org admins can view member certificates" on public.certificates
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = certificates.user_id
        and p.organization_id is not null
        and public.is_org_admin(p.organization_id)
    )
  );

-- ============================================================
-- organization_invites policies
-- ============================================================
drop policy if exists "Org admins can view invites for their org" on public.organization_invites;
create policy "Org admins can view invites for their org" on public.organization_invites
  for select using (public.is_org_admin(organization_id));

drop policy if exists "Org admins can create invites for their org" on public.organization_invites;
create policy "Org admins can create invites for their org" on public.organization_invites
  for insert with check (public.is_org_admin(organization_id) and invited_by = auth.uid());

drop policy if exists "Org admins can update invites for their org" on public.organization_invites;
create policy "Org admins can update invites for their org" on public.organization_invites
  for update using (public.is_org_admin(organization_id));

-- An invited person (who may not be an org admin anywhere) needs to see
-- their own pending invite by email in order to accept it.
drop policy if exists "Invitees can view invites addressed to their email" on public.organization_invites;
create policy "Invitees can view invites addressed to their email" on public.organization_invites
  for select using (
    email = (select email from public.profiles where id = auth.uid())
  );

drop policy if exists "Invitees can accept their own invite" on public.organization_invites;
create policy "Invitees can accept their own invite" on public.organization_invites
  for update using (
    email = (select email from public.profiles where id = auth.uid())
  );

-- ============================================================
-- Auto-link a brand-new signup to a pending invite matching their email —
-- the common "invite a coworker who doesn't have an account yet" case.
-- Existing users being invited accept manually from the app instead (see
-- acceptOrganizationInvite in src/lib/store.ts).
--
-- This REPLACES the handle_new_user() function from schema.sql with an
-- extended version — everything it did before, plus the invite check.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  matched_invite record;
begin
  insert into public.profiles (id, email, name, role, region)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', ''),
    coalesce(new.raw_user_meta_data->>'region', 'CA')
  );

  select * into matched_invite
  from public.organization_invites
  where email = new.email and status = 'pending'
  order by created_at asc
  limit 1;

  if found then
    update public.profiles
    set organization_id = matched_invite.organization_id, org_role = 'member'
    where id = new.id;

    update public.organization_invites
    set status = 'accepted', accepted_at = now()
    where id = matched_invite.id;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- To check it's working:
--   select * from public.organizations;
--   select id, email, organization_id, org_role from public.profiles where organization_id is not null;
--   select * from public.organization_invites;

drop policy if exists "Owners can view their organization" on public.organizations;
create policy "Owners can view their organization" on public.organizations
  for select using (owner_id = auth.uid());

-- ============================================================
-- Seat-based billing for clinics/teams (separate from the individual
-- cert-count-based plan on profiles). Every org now needs a plan — even
-- ones created before this existed default to 'starter' with a fresh
-- 7-day trial, so nothing is left in a broken state.
-- ============================================================
alter table public.organizations add column if not exists plan text not null default 'starter';
alter table public.organizations drop constraint if exists organizations_plan_check;
alter table public.organizations add constraint organizations_plan_check
  check (plan in ('starter', 'team', 'clinic', 'business', 'enterprise'));

alter table public.organizations add column if not exists billing_cycle text not null default 'monthly';
alter table public.organizations drop constraint if exists organizations_billing_cycle_check;
alter table public.organizations add constraint organizations_billing_cycle_check
  check (billing_cycle in ('monthly', 'yearly'));

alter table public.organizations add column if not exists stripe_customer_id text;

alter table public.organizations add column if not exists subscription_status text not null default 'trialing';
alter table public.organizations drop constraint if exists organizations_subscription_status_check;
alter table public.organizations add constraint organizations_subscription_status_check
  check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete'));

alter table public.organizations add column if not exists trial_ends_at timestamptz default (now() + interval '7 days');

-- To check it's working:
--   select id, name, plan, billing_cycle, subscription_status, trial_ends_at from public.organizations;

-- ============================================================
-- Fix: brand-new orgs used to default to 'trialing' with a trial_ends_at
-- already set, which meant a clinic got full trial access the instant the
-- row was created — BEFORE Stripe Checkout ever ran. Abandoning checkout
-- (closing the tab, refreshing) left them with a working, fully-featured
-- trial and no card on file, so nothing would ever charge them when the
-- trial "ended." New orgs now start 'incomplete' (not a real trial yet);
-- the stripe-webhook handler is what flips them to 'trialing' with a real
-- trial_ends_at, and only once Stripe confirms checkout.session.completed.
-- The frontend (Team.tsx / TeamSettings.tsx) blocks the dashboard behind a
-- "finish setting up billing" screen for orgs still stuck on 'incomplete'.
-- ============================================================
alter table public.organizations alter column subscription_status set default 'incomplete';
alter table public.organizations alter column trial_ends_at drop default;

-- Also store the actual Stripe subscription ID (not just customer ID) so a
-- later plan change can modify the existing subscription directly instead
-- of creating a whole new one.
alter table public.organizations add column if not exists stripe_subscription_id text;

-- To check it's working (new signups from now on should show 'incomplete'
-- with a null trial_ends_at until they finish Stripe Checkout):
--   select id, name, subscription_status, trial_ends_at, stripe_subscription_id from public.organizations order by created_at desc;

-- ============================================================
-- Certificate scope: 'clinic' vs 'personal'.
--
-- A team member's certificates aren't all automatically covered by their
-- clinic's plan — only the ones they mark as clinic-related. Those are
-- unlimited and visible to the clinic admin. Anything marked 'personal'
-- counts against that person's own individual plan (free/plus/pro, same
-- limits as someone with no team at all) and is never shown to the admin.
-- Defaults to 'personal' since that's the correct behavior for the vast
-- majority of users who aren't on any team.
-- ============================================================
alter table public.certificates add column if not exists scope text not null default 'personal';
alter table public.certificates drop constraint if exists certificates_scope_check;
alter table public.certificates add constraint certificates_scope_check
  check (scope in ('clinic', 'personal'));

-- To check it's working:
--   select id, name, scope from public.certificates;

-- ============================================================
-- One-time backfill: anyone who was ALREADY on a team before the
-- clinic/personal split above existed had every one of their certs
-- treated as clinic-covered (that was the whole team dashboard). Without
-- this, their existing certs default to 'personal' and would vanish from
-- the Team page as "not tracked," which is wrong — they didn't change
-- anything. Only run this ONCE, right after the migration above. Anyone
-- who joins a team after today starts fresh at 'personal' and chooses
-- scope per-cert going forward, which is correct.
-- ============================================================
update public.certificates
set scope = 'clinic'
where scope = 'personal'
  and user_id in (select id from public.profiles where organization_id is not null);

-- To check it's working:
--   select p.email, count(*) filter (where c.scope = 'clinic') as clinic_certs
--   from public.certificates c join public.profiles p on p.id = c.user_id
--   where p.organization_id is not null group by p.email;

-- ============================================================
-- Industry gating: which side of the homepage split-screen chooser an
-- account belongs to (see src/lib/industryPref.ts and
-- src/pages/IndustryChooser.tsx) — 'healthcare' or 'other' (construction,
-- education, policing). Enforced at login in Auth.tsx: a healthcare account
-- can't sign in from the other-industries page and vice versa. Every
-- existing row defaults to 'healthcare' since the whole product was
-- healthcare-only before this feature existed.
-- ============================================================
alter table public.profiles add column if not exists industry text not null default 'healthcare';
alter table public.profiles drop constraint if exists profiles_industry_check;
alter table public.profiles add constraint profiles_industry_check check (industry in ('healthcare', 'other'));

alter table public.organizations add column if not exists industry text not null default 'healthcare';
alter table public.organizations drop constraint if exists organizations_industry_check;
alter table public.organizations add constraint organizations_industry_check check (industry in ('healthcare', 'other'));

-- Extend handle_new_user() again: capture industry from signup metadata
-- (see signUp() in src/lib/store.ts), and when auto-linking a brand-new
-- signup to a pending team invite, force their industry to match their
-- organization's actual industry rather than whatever their own device
-- happened to remember — a teammate can never end up mismatched from their
-- own team just because they opened the invite link from a different page.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  matched_invite record;
begin
  insert into public.profiles (id, email, name, role, region, industry)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', ''),
    coalesce(new.raw_user_meta_data->>'region', 'CA'),
    coalesce(new.raw_user_meta_data->>'industry', 'healthcare')
  );

  select * into matched_invite
  from public.organization_invites
  where email = new.email and status = 'pending'
  order by created_at asc
  limit 1;

  if found then
    update public.profiles
    set organization_id = matched_invite.organization_id,
        org_role = 'member',
        industry = coalesce(
          (select industry from public.organizations where id = matched_invite.organization_id),
          'healthcare'
        )
    where id = new.id;

    update public.organization_invites
    set status = 'accepted', accepted_at = now()
    where id = matched_invite.id;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- To check it's working:
--   select id, email, industry from public.profiles order by created_at desc;
--   select id, name, industry from public.organizations order by created_at desc;
