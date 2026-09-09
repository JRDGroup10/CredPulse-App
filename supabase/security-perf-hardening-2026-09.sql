-- Security & performance hardening pass, applied 2026-09-09 to the live
-- project via a technical audit. Run this AFTER all the other
-- supabase/*.sql files on a fresh install to get the same fixes — it's
-- additive/idempotent (CREATE OR REPLACE, DROP POLICY IF EXISTS, CREATE
-- INDEX IF EXISTS) so it's also safe to re-run on the existing project.
--
-- What this fixes, and why:
--
-- 1. generate_referral_code() had a mutable search_path (a real, if narrow,
--    hijacking risk for SECURITY DEFINER-adjacent functions) — pinned to
--    'public'.
--
-- 2. handle_new_user() and notify_admin_of_signup() are trigger functions
--    only (they read NEW, which doesn't exist outside a trigger context),
--    but were still directly callable by anon/authenticated via
--    /rest/v1/rpc/<name> — unnecessary public attack surface, even though
--    calling either directly already fails safely today. Revoked EXECUTE
--    from PUBLIC (note: NOT from individual roles — Postgres grants
--    EXECUTE to PUBLIC by default, and revoking from a specific role
--    doesn't remove a PUBLIC grant, so PUBLIC has to be the target).
--    Trigger firing is unaffected; that mechanism doesn't check EXECUTE
--    grants.
--
-- 3. is_org_admin(uuid) is a helper used inside several RLS policies; it
--    needs to stay executable by `authenticated` (that's the role RLS
--    evaluates it as), but had no reason to also be exposed to `anon`.
--
-- 4. 27 RLS policies called auth.uid() directly in their USING/WITH CHECK
--    clause, which Postgres re-evaluates per row instead of once per
--    query. Wrapping it as (select auth.uid()) turns it into a stable
--    InitPlan the planner evaluates once — a real, documented Supabase
--    performance pattern, not a security or behavior change. See
--    https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- 5. Ten foreign-key columns had no covering index (api_keys.created_by,
--    audit_log.actor_id, certificates.user_id/verified_by,
--    organization_invites.invited_by/organization_id,
--    organizations.owner_id, profiles.organization_id/referred_by,
--    push_subscriptions.user_id) — added indexes so joins/cascades on
--    these don't degrade as the tables grow past a handful of rows.
--
-- Deliberately NOT changed here (reviewed, not bugs):
--   - industry_compliance_benchmarks stays SECURITY DEFINER on purpose —
--     it only returns industry-level aggregates (no row-level PII), and
--     switching it to SECURITY INVOKER would break the whole point of a
--     peer-benchmark feature (a normal user's RLS wouldn't let them see
--     other orgs' data at all). It's already grant-restricted to
--     `authenticated` only (see organizations-schema.sql), not `anon`.
--   - "Multiple permissive policies" (certificates/profiles/organizations/
--     organization_invites each have two separate SELECT/UPDATE policies —
--     one for "own row", one for "org admin viewing a member's row").
--     Postgres OR's these together correctly; it's a minor per-query
--     planning cost, not a correctness issue. Left alone this round to
--     avoid touching multi-policy interaction on a live app with real
--     billing customers for a purely cosmetic perf gain at current
--     (single-digit-row) scale — worth consolidating later if the org
--     tables grow substantially.
--   - Leaked-password protection (HaveIBeenPwned check) is still off —
--     that's an Auth setting in the Supabase dashboard
--     (Authentication -> Policies), not something reachable via SQL.
--     Toggle it on there; it's a 10-second change.

-- ---------------------------------------------------------------------
-- 1) search_path
-- ---------------------------------------------------------------------
create or replace function public.generate_referral_code()
returns text
language plpgsql
set search_path to 'public'
as $function$
declare
  candidate text;
  already_taken boolean;
begin
  loop
    candidate := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 7));
    select exists(select 1 from public.profiles where referral_code = candidate) into already_taken;
    exit when not already_taken;
  end loop;
  return candidate;
end;
$function$;

-- ---------------------------------------------------------------------
-- 2) trigger-only functions: no direct public RPC surface
-- ---------------------------------------------------------------------
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.notify_admin_of_signup() from public;

-- ---------------------------------------------------------------------
-- 3) is_org_admin: authenticated only
-- ---------------------------------------------------------------------
revoke execute on function public.is_org_admin(uuid) from public;
grant execute on function public.is_org_admin(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 4) RLS: evaluate auth.uid() once per query, not once per row
-- ---------------------------------------------------------------------
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert
  with check ((select auth.uid()) = id);

drop policy if exists "Users can view own certificates" on public.certificates;
create policy "Users can view own certificates" on public.certificates for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own certificates" on public.certificates;
create policy "Users can insert own certificates" on public.certificates for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own certificates" on public.certificates;
create policy "Users can update own certificates" on public.certificates for update
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own certificates" on public.certificates;
create policy "Users can delete own certificates" on public.certificates for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own push subscriptions" on public.push_subscriptions;
create policy "Users can view own push subscriptions" on public.push_subscriptions for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own push subscriptions" on public.push_subscriptions;
create policy "Users can insert own push subscriptions" on public.push_subscriptions for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own push subscriptions" on public.push_subscriptions;
create policy "Users can update own push subscriptions" on public.push_subscriptions for update
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own push subscriptions" on public.push_subscriptions;
create policy "Users can delete own push subscriptions" on public.push_subscriptions for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "Members can view their own organization" on public.organizations;
create policy "Members can view their own organization" on public.organizations for select
  using (id = (select profiles.organization_id from public.profiles where profiles.id = (select auth.uid())));

drop policy if exists "Owners can update their organization" on public.organizations;
create policy "Owners can update their organization" on public.organizations for update
  using (owner_id = (select auth.uid()));

drop policy if exists "Any signed-in user can create an organization" on public.organizations;
create policy "Any signed-in user can create an organization" on public.organizations for insert
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can view their organization" on public.organizations;
create policy "Owners can view their organization" on public.organizations for select
  using (owner_id = (select auth.uid()));

drop policy if exists "Org admins can create invites for their org" on public.organization_invites;
create policy "Org admins can create invites for their org" on public.organization_invites for insert
  with check (is_org_admin(organization_id) and invited_by = (select auth.uid()));

drop policy if exists "Invitees can view invites addressed to their email" on public.organization_invites;
create policy "Invitees can view invites addressed to their email" on public.organization_invites for select
  using (email = (select profiles.email from public.profiles where profiles.id = (select auth.uid())));

drop policy if exists "Invitees can accept their own invite" on public.organization_invites;
create policy "Invitees can accept their own invite" on public.organization_invites for update
  using (email = (select profiles.email from public.profiles where profiles.id = (select auth.uid())));

drop policy if exists "Org admins can read their audit log" on public.audit_log;
create policy "Org admins can read their audit log" on public.audit_log for select
  using (organization_id in (
    select profiles.organization_id from public.profiles
    where profiles.id = (select auth.uid()) and profiles.org_role = any (array['owner','admin'])
  ));

drop policy if exists "Members can log their own actions in their own org" on public.audit_log;
create policy "Members can log their own actions in their own org" on public.audit_log for insert
  with check (
    actor_id = (select auth.uid())
    and organization_id in (select profiles.organization_id from public.profiles where profiles.id = (select auth.uid()))
  );

drop policy if exists "Org admins can create api keys for their org" on public.api_keys;
create policy "Org admins can create api keys for their org" on public.api_keys for insert
  with check (
    created_by = (select auth.uid())
    and organization_id in (
      select profiles.organization_id from public.profiles
      where profiles.id = (select auth.uid()) and profiles.org_role = any (array['owner','admin'])
    )
  );

drop policy if exists "Org admins can revoke their org's api keys" on public.api_keys;
create policy "Org admins can revoke their org's api keys" on public.api_keys for update
  using (organization_id in (
    select profiles.organization_id from public.profiles
    where profiles.id = (select auth.uid()) and profiles.org_role = any (array['owner','admin'])
  ));

drop policy if exists "Org admins can view their org's api keys" on public.api_keys;
create policy "Org admins can view their org's api keys" on public.api_keys for select
  using (organization_id in (
    select profiles.organization_id from public.profiles
    where profiles.id = (select auth.uid()) and profiles.org_role = any (array['owner','admin'])
  ));

drop policy if exists "Users can view own CEU credit logs" on public.ceu_credit_logs;
create policy "Users can view own CEU credit logs" on public.ceu_credit_logs for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own CEU credit logs" on public.ceu_credit_logs;
create policy "Users can insert own CEU credit logs" on public.ceu_credit_logs for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own CEU credit logs" on public.ceu_credit_logs;
create policy "Users can delete own CEU credit logs" on public.ceu_credit_logs for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view referrals they made" on public.referrals;
create policy "Users can view referrals they made" on public.referrals for select
  using ((select auth.uid()) = referrer_id);

-- ---------------------------------------------------------------------
-- 5) covering indexes for foreign keys
-- ---------------------------------------------------------------------
create index if not exists api_keys_created_by_idx on public.api_keys(created_by);
create index if not exists audit_log_actor_id_idx on public.audit_log(actor_id);
create index if not exists certificates_user_id_idx on public.certificates(user_id);
create index if not exists certificates_verified_by_idx on public.certificates(verified_by);
create index if not exists organization_invites_invited_by_idx on public.organization_invites(invited_by);
create index if not exists organization_invites_organization_id_idx on public.organization_invites(organization_id);
create index if not exists organizations_owner_id_idx on public.organizations(owner_id);
create index if not exists profiles_organization_id_idx on public.profiles(organization_id);
create index if not exists profiles_referred_by_idx on public.profiles(referred_by);
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
