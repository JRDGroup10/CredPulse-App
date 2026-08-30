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
