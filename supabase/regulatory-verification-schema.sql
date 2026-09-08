-- CredPulse regulatory-body verification schema.
-- Run this once in your Supabase project's SQL Editor (Project -> SQL Editor -> New query),
-- then click Run. Safe to re-run — every statement is idempotent.
--
-- What this is for: a link to the issuing body's own verification tool (see
-- src/lib/verificationProviders.ts) only gets someone *to* the check — it
-- doesn't record that anyone actually did it. The substantive part of this
-- feature is the attestation trail: a clinic/team admin can mark a member's
-- certificate as independently verified against the issuing body's registry,
-- which shows up as a badge on the manager dashboard and a durable audit_log
-- entry (see organizations-schema.sql for that table). This is deliberately
-- scoped to clinic-scoped certificates only — the whole point is that
-- someone *other than* the certificate's owner is attesting to it, which
-- only makes sense when there's a manager relationship in the first place.
-- An individual with no organization still gets the verification-tool link
-- (self-service, no attestation trail) but never the "mark verified" action.

alter table public.certificates add column if not exists verified_at timestamptz;
alter table public.certificates add column if not exists verified_by uuid references public.profiles(id) on delete set null;

-- Mirrors the existing "Org admins can view member certificates" SELECT
-- policy (see schema.sql/organizations-schema.sql) but for UPDATE, and only
-- for clinic-scoped certs. Like the existing per-owner UPDATE policy (used
-- today by updateCertificateCeuRequirement()), this doesn't restrict *which*
-- columns get changed at the database level — Postgres RLS only gates rows,
-- not columns — so it relies on the app only ever writing verified_at/
-- verified_by through this path, same trust model already used elsewhere
-- in this schema. Both this policy and the per-owner one are independently
-- permissive (Postgres OR's same-command policies together), so a cert
-- owner keeps their existing ability to edit their own cert regardless.
drop policy if exists "Org admins can verify member certificates" on public.certificates;
create policy "Org admins can verify member certificates" on public.certificates
  for update using (
    scope = 'clinic'
    and exists (
      select 1 from public.profiles p
      where p.id = certificates.user_id
        and p.organization_id is not null
        and public.is_org_admin(p.organization_id)
    )
  );

-- To check it's working:
--   select id, name, scope, verified_at, verified_by from public.certificates where verified_at is not null;

notify pgrst, 'reload schema';
