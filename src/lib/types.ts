import { IndustryPref } from "./industryPref";

export type CredStatus = "expired" | "urgent" | "upcoming" | "valid";

export type Plan = "free" | "plus" | "pro";
export type BillingCycle = "monthly" | "yearly";
export type Region = "CA" | "US";
export type OrgRole = "owner" | "admin" | "member";

// Seat-based plans for clinics/teams — separate from the cert-count-based
// individual Plan above. See src/lib/orgPlans.ts for pricing/seat limits.
export type OrgPlan = "starter" | "team" | "clinic" | "business" | "enterprise";
export type OrgSubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";

// Whether a certificate counts against the clinic's unlimited allotment
// (visible to the clinic admin) or the individual's own plan limit (private
// to them). Meaningless/always "personal" for a user with no organization.
export type CertScope = "clinic" | "personal";

export interface Certificate {
  id: string;
  name: string; // e.g. "Basic Life Support (BLS)"
  issuer: string; // e.g. "Heart and Stroke Foundation"
  credentialType: "certification" | "license" | "training";
  issuedDate: string; // ISO date
  expiryDate: string; // ISO date
  fileName?: string;
  filePath?: string; // Supabase Storage object path, e.g. "<userId>/169...-bls.pdf"
  notes?: string;
  tip?: string; // e.g. "Renew in person, book ahead — slots fill up." (Plus/Pro only)
  renewalUrl?: string; // direct link to the renewal/booking site (Plus/Pro only)
  scope: CertScope;
  // CE-credit tracking (see supabase/ceu-tracking-schema.sql) — opt-in per
  // certificate at add-time, for certs that renew via accumulated
  // continuing-education credits (CPC, CRCST, PANCE) rather than a single
  // course/exam. undefined/null means this cert doesn't use the CEU model
  // and CeuTracker.tsx never shows for it.
  ceuRequired?: number;
}

// One logged credit-earning activity toward a certificate's ceuRequired
// total. See CeuTracker.tsx and store.ts's listCeuCredits()/addCeuCredit().
export interface CeuCreditLog {
  id: string;
  certificateId: string;
  credits: number;
  activityName: string;
  completedDate: string; // ISO date
  createdAt: string;
}

export interface UserProfile {
  name: string;
  role: string; // e.g. "Registered Nurse"
  email: string;
  reminderDays: number[]; // e.g. [90, 30, 7]
  plan: Plan;
  billingCycle: BillingCycle;
  region: Region;
  organizationId: string | null; // set once this user creates or joins a team
  orgRole: OrgRole;
  // Which side of the homepage split-screen chooser this account was created
  // under (see lib/industryPref.ts) — set once at signup and enforced at
  // login (see Auth.tsx) so a healthcare account can't sign in from the
  // construction/education/policing side, or vice versa.
  industry: IndustryPref;
  // Referral/viral-loop feature (see supabase/referrals-schema.sql).
  // referralCode is this user's own shareable code (e.g. "?ref=AB12CD3");
  // bonusCertSlots is added on top of the plan's base cert limit in
  // certLimit() below, +1 per person this user has successfully referred
  // (the new signup themselves gets no bonus), capped at 4 by the database
  // trigger that awards it.
  referralCode: string;
  bonusCertSlots: number;
}

export interface AppState {
  profile: UserProfile;
  certificates: Certificate[];
}

// ============================================================
// Team/Clinic compliance dashboard
// ============================================================

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  plan: OrgPlan;
  billingCycle: BillingCycle;
  subscriptionStatus: OrgSubscriptionStatus;
  trialEndsAt: string | null;
  industry: IndustryPref;
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: string; // their healthcare role, e.g. "Registered Nurse"
  orgRole: OrgRole;
}

export interface OrgInvite {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
}

export interface OrgInviteWithOrgName extends OrgInvite {
  organizationId: string;
  organizationName: string;
}

// ============================================================
// Audit log — enterprise-readiness feature. See
// supabase/organizations-schema.sql for the table/RLS and
// src/lib/store.ts's logAudit()/listAuditLog() for how entries are
// written and read.
// ============================================================

export type AuditAction =
  | "certificate.created"
  | "certificate.deleted"
  | "invite.sent"
  | "invite.revoked"
  | "invite.accepted"
  | "org.plan_changed"
  | "api_key.created"
  | "api_key.revoked"
  | "member.updated";

export interface AuditLogEntry {
  id: string;
  actorName: string; // falls back to actor's email if no name on file
  action: AuditAction;
  targetLabel: string | null; // human-readable snapshot, e.g. a cert name or invited email
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ============================================================
// Public API — enterprise-readiness feature. See
// supabase/organizations-schema.sql for the api_keys table/RLS,
// supabase/functions/public-api for the actual API, and
// src/lib/store.ts's generateApiKey()/listApiKeys()/revokeApiKey().
// ============================================================

export interface ApiKey {
  id: string;
  label: string;
  keyPrefix: string; // e.g. "cp_live_ab12" — enough to recognize which key is which, never the whole thing
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

// ============================================================
// Referral / viral loop. See supabase/referrals-schema.sql for the
// referrals table + handle_new_user() reward logic, and
// src/lib/store.ts's getReferralSummary().
// ============================================================

export const MAX_BONUS_CERT_SLOTS = 4;

export interface ReferralSummary {
  referralCode: string;
  referralCount: number;
  bonusCertSlots: number;
  maxBonusCertSlots: number;
}
