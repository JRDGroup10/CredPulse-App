-- CRE-7 (2026-09-13): Supabase's performance advisor flagged 4 tables
-- (certificates, organization_invites, organizations, profiles) where two
-- separate permissive RLS policies apply to the same role+action (e.g.
-- certificates SELECT: "Users can view own certificates" AND "Org admins
-- can view member certificates" both apply). Postgres ORs these together
-- correctly today -- this was never a security bug -- but it evaluates
-- both policies on every matching query, which is unnecessary planning
-- overhead. This file merges each pair into a single policy with an OR'd
-- USING clause, preserving identical effective access.
--
-- Already applied directly to the live project via the Supabase management
-- API on 2026-09-13 (see CRE-7 in Linear for the before/after advisor
-- output). This file exists so a from-scratch project setup ends up with
-- the same consolidated policies instead of recreating the original
-- duplicates from schema.sql / organizations-schema.sql. Run after those
-- two files (and after regulatory-verification-schema.sql, which is the
-- last file to touch the certificates UPDATE policy before this one).

-- certificates: SELECT (own row OR org-admin viewing a clinic member's cert)
drop policy if exists "Users can view own certificates" on public.certificates;
drop policy if exists "Org admins can view member certificates" on public.certificates;
create policy "Users can view own or admin can view member certificates"
  on public.certificates for select
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = certificates.user_id
        and p.organization_id is not null
        and is_org_admin(p.organization_id)
    )
  );

-- certificates: UPDATE (own row OR org-admin verifying a clinic-scoped cert)
drop policy if exists "Users can update own certificates" on public.certificates;
drop policy if exists "Org admins can verify member certificates" on public.certificates;
create policy "Users can update own or admin can verify member certificates"
  on public.certificates for update
  using (
    (select auth.uid()) = user_id
    or (
      scope = 'clinic'
      and exists (
        select 1 from public.profiles p
        where p.id = certificates.user_id
          and p.organization_id is not null
          and is_org_admin(p.organization_id)
      )
    )
  );

-- organization_invites: SELECT (invitee by email OR org admin)
drop policy if exists "Invitees can view invites addressed to their email" on public.organization_invites;
drop policy if exists "Org admins can view invites for their org" on public.organization_invites;
create policy "Invitees or org admins can view invites"
  on public.organization_invites for select
  using (
    email = (select profiles.email from public.profiles where profiles.id = (select auth.uid()))
    or is_org_admin(organization_id)
  );

-- organization_invites: UPDATE (invitee accepting OR org admin managing)
drop policy if exists "Invitees can accept their own invite" on public.organization_invites;
drop policy if exists "Org admins can update invites for their org" on public.organization_invites;
create policy "Invitees or org admins can update invites"
  on public.organization_invites for update
  using (
    email = (select profiles.email from public.profiles where profiles.id = (select auth.uid()))
    or is_org_admin(organization_id)
  );

-- organizations: SELECT (member of the org OR the owner)
drop policy if exists "Members can view their own organization" on public.organizations;
drop policy if exists "Owners can view their organization" on public.organizations;
create policy "Members or owners can view their organization"
  on public.organizations for select
  using (
    id = (select profiles.organization_id from public.profiles where profiles.id = (select auth.uid()))
    or owner_id = (select auth.uid())
  );

-- profiles: SELECT (own profile OR org-admin viewing a member's profile)
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Org admins can view member profiles" on public.profiles;
create policy "Users can view own or admin can view member profiles"
  on public.profiles for select
  using (
    (select auth.uid()) = id
    or (organization_id is not null and is_org_admin(organization_id))
  );
