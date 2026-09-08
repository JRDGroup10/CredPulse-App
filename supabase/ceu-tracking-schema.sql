-- CredPulse CE-credit tracking schema.
-- Run this once in your Supabase project's SQL Editor (Project -> SQL Editor -> New query),
-- then click Run. Safe to re-run — every statement is idempotent.
--
-- What this is for: some certifications (CPC, CRCST, PANCE, and similar —
-- see the content guides added for these) don't renew via a single course or
-- exam. They renew by accumulating a required number of continuing-education
-- credits (CEUs) across the whole cycle. This is a genuinely different
-- tracking problem from "take a course before this date" — it's "earn N
-- credits by this date," which means the useful thing to show isn't just a
-- countdown, it's progress against a total. See src/components/CeuTracker.tsx
-- and src/lib/store.ts's listCeuCredits()/addCeuCredit()/deleteCeuCredit().

-- A certificate opts into CEU tracking by having a non-null ceu_required —
-- set once at add-time in AddCertificate.tsx. Certs that don't use the CEU
-- model (BLS, Working at Heights, etc.) just leave this null and never show
-- the tracker at all.
alter table public.certificates add column if not exists ceu_required int;

-- One row per logged credit-earning activity, so progress accumulates over
-- the whole renewal cycle rather than being a single number someone has to
-- remember to update. Credits can be fractional (many CEU programs award
-- half-credits for shorter activities), hence numeric rather than int.
create table if not exists public.ceu_credit_logs (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.certificates(id) on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  credits numeric(6, 2) not null check (credits > 0),
  activity_name text not null default '',
  completed_date date not null,
  created_at timestamptz not null default now()
);

alter table public.ceu_credit_logs enable row level security;

drop policy if exists "Users can view own CEU credit logs" on public.ceu_credit_logs;
create policy "Users can view own CEU credit logs" on public.ceu_credit_logs
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own CEU credit logs" on public.ceu_credit_logs;
create policy "Users can insert own CEU credit logs" on public.ceu_credit_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own CEU credit logs" on public.ceu_credit_logs;
create policy "Users can delete own CEU credit logs" on public.ceu_credit_logs
  for delete using (auth.uid() = user_id);

create index if not exists ceu_credit_logs_certificate_id_idx on public.ceu_credit_logs (certificate_id);
create index if not exists ceu_credit_logs_user_id_idx on public.ceu_credit_logs (user_id);

notify pgrst, 'reload schema';
