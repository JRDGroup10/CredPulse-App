import { describe, expect, it } from "vitest";
import { certLimit, certLimitReached } from "./store";
import { AppState, Certificate, MAX_BONUS_CERT_SLOTS, UserProfile } from "./types";

// certLimit()/certLimitReached() are the two places a referral's reward
// (profiles.bonus_cert_slots — see supabase/referrals-schema.sql) actually
// takes effect: it's added on top of the individual plan's base cert count
// (free=2, plus=5, pro=Infinity — see plans.ts). Getting this wrong in
// either direction is directly user-visible: too low and a referral reward
// silently does nothing; too high (e.g. applied on top of Pro's Infinity in
// a way that breaks the Infinity check) and free-plan gating elsewhere could
// misbehave.

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    name: "Jane Doe",
    role: "Registered Nurse",
    email: "jane@example.com",
    reminderDays: [90, 30, 7],
    plan: "free",
    billingCycle: "monthly",
    region: "CA",
    organizationId: null,
    orgRole: "member",
    industry: "healthcare",
    referralCode: "AB12CD3",
    bonusCertSlots: 0,
    ...overrides
  };
}

function makeCerts(n: number): Certificate[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `cert-${i}`,
    name: `Cert ${i}`,
    issuer: "Some Issuer",
    credentialType: "certification",
    issuedDate: "2025-01-01",
    expiryDate: "2027-01-01",
    scope: "personal"
  }));
}

describe("certLimit with referral bonus slots", () => {
  it("free plan with no referrals uses the plain plan limit (2)", () => {
    const state: AppState = { profile: makeProfile(), certificates: [] };
    expect(certLimit(state)).toBe(2);
  });

  it("adds bonus_cert_slots on top of the plan's base limit", () => {
    const state: AppState = { profile: makeProfile({ bonusCertSlots: 3 }), certificates: [] };
    expect(certLimit(state)).toBe(5); // 2 (free) + 3 bonus
  });

  it("plus plan bonus stacks on top of its own base limit (5)", () => {
    const state: AppState = { profile: makeProfile({ plan: "plus", bonusCertSlots: 2 }), certificates: [] };
    expect(certLimit(state)).toBe(7);
  });

  it("pro plan (Infinity) is unaffected by bonus slots — stays Infinity, not Infinity+n behavior weirdness", () => {
    const state: AppState = { profile: makeProfile({ plan: "pro", bonusCertSlots: MAX_BONUS_CERT_SLOTS }), certificates: [] };
    expect(certLimit(state)).toBe(Infinity);
  });

  it("MAX_BONUS_CERT_SLOTS is 4 — referrer-only reward, capped lower than the old both-sides/10 design", () => {
    // This constant is display-only on the client (the real cap is enforced
    // in the handle_new_user() trigger — see referrals-schema.sql), but a
    // silent drift here would show the wrong "max reached" state in
    // ReferralCard.tsx even while the database enforces the real cap correctly.
    expect(MAX_BONUS_CERT_SLOTS).toBe(4);
  });

  it("certLimitReached respects the raised limit — not reached until the bonus-adjusted count", () => {
    const state: AppState = {
      profile: makeProfile({ bonusCertSlots: 1 }), // limit is 2 + 1 = 3
      certificates: makeCerts(2)
    };
    expect(certLimitReached(state)).toBe(false);

    const atCap: AppState = { ...state, certificates: makeCerts(3) };
    expect(certLimitReached(atCap)).toBe(true);
  });

  it("certLimitReached still ignores clinic-scoped certs regardless of bonus slots", () => {
    const state: AppState = {
      profile: makeProfile({ bonusCertSlots: 0, organizationId: "org-1" }),
      certificates: [
        { ...makeCerts(1)[0], scope: "clinic" },
        { ...makeCerts(1)[0], id: "cert-clinic-2", scope: "clinic" }
      ]
    };
    // Two clinic-scoped certs, zero personal ones — free plan's limit of 2
    // is about personal certs only, so this should not be "reached".
    expect(certLimitReached(state, "personal")).toBe(false);
    expect(certLimitReached(state, "clinic")).toBe(false);
  });
});
