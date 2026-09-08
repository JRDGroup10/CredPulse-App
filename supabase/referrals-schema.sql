-- CredPulse referral/viral-loop schema.
-- Run this once in your Supabase project's SQL Editor (Project -> SQL Editor -> New query),
-- then click Run. Safe to re-run — every statement is idempotent.
--
-- How it works: every user gets a short, permanent referral_code the moment
-- their profile is created. Sharing a link like
-- https://credpulse.app/?ref=<code> and having someone sign up through it
-- grants the REFERRER (only — not the new signup) a small permanent reward —
-- +1 tracked-certificate slot on top of whatever their plan already allows
-- (see PLANS in src/lib/plans.ts and certLimit() in src/lib/store.ts, which
-- adds bonus_cert_slots on top of the plan's base limit). Capped at 4 so it
-- can't be farmed into a free unlimited plan. No money changes hands — this
-- is deliberately a product reward, not a Stripe credit, so there's nothing
-- to reconcile or refund if someone signs up and never converts.

alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists bonus_cert_slots int not null default 0;

-- Short, shareable, unique per user. 7 base32-ish uppercase characters —
-- long enough that random collisions are effectively impossible, short
-- enough to read aloud or type by hand.
create or replace function public.generate_referral_code()
returns text as $$
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
$$ language plpgsql;

-- Backfill for any profiles created before this column existed, so every
-- existing user has a working referral link the moment this SQL runs.
update public.profiles set referral_code = public.generate_referral_code() where referral_code is null;

alter table public.profiles alter column referral_code set not null;
create unique index if not exists profiles_referral_code_key on public.profiles (referral_code);

-- referrals: one row per successful referral — used for the "you've
-- referred N people" count in Settings. Append-only by design (like
-- audit_log): no update/delete policy, because a referral either happened
-- or it didn't, and rewriting history here would let someone hide having
-- farmed the reward cap.
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.referrals enable row level security;

drop policy if exists "Users can view referrals they made" on public.referrals;
create policy "Users can view referrals they made" on public.referrals
  for select using (auth.uid() = referrer_id);

create index if not exists referrals_referrer_id_idx on public.referrals (referrer_id);

-- Extend handle_new_user() again (see organizations-schema.sql for the
-- version this replaces — name/role/region/industry + invite auto-link):
-- generate this new user's own referral_code, and if they signed up via
-- someone else's link (raw_user_meta_data->>'referral_code', set in
-- signUp() in src/lib/store.ts and captured from ?ref= in Auth.tsx), link
-- the two accounts, log the referral, and grant the REFERRER (only — the new
-- signup gets no bonus of their own for having been referred) their bonus
-- slot — capped at 4 so the reward can't be farmed past a fixed ceiling.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  matched_invite record;
  ref_code text;
  referrer_row public.profiles%rowtype;
begin
  ref_code := new.raw_user_meta_data->>'referral_code';
  if ref_code is not null and ref_code <> '' then
    select * into referrer_row from public.profiles where referral_code = upper(ref_code);
  end if;

  insert into public.profiles (id, email, name, role, region, industry, referral_code, referred_by, bonus_cert_slots)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', ''),
    coalesce(new.raw_user_meta_data->>'region', 'CA'),
    coalesce(new.raw_user_meta_data->>'industry', 'healthcare'),
    public.generate_referral_code(),
    referrer_row.id,
    0
  );

  if referrer_row.id is not null then
    insert into public.referrals (referrer_id, referred_id) values (referrer_row.id, new.id);
    update public.profiles
      set bonus_cert_slots = least(bonus_cert_slots + 1, 4)
      where id = referrer_row.id;
  end if;

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

-- One-time correction for anyone who ran an earlier version of this file:
-- that version (a) gave the new signup +1 bonus_cert_slots just for being
-- referred, and (b) capped the referrer's reward at 10 instead of 4. Since
-- bonus_cert_slots has no other source (nothing else in the app writes to
-- it), the correct value for every profile is simply how many people they've
-- actually referred, capped at the new limit — recomputing it from the
-- referrals table below fixes both issues at once and is safe to re-run.
update public.profiles p
set bonus_cert_slots = least(4, (
  select count(*) from public.referrals r where r.referrer_id = p.id
));

-- To check it's working:
--   select id, email, referral_code, referred_by, bonus_cert_slots from public.profiles order by created_at desc;
--   select * from public.referrals order by created_at desc;

notify pgrst, 'reload schema';
