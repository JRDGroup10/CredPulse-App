import { BillingCycle, OrgPlan } from "./types";

// Seat-based pricing for clinics/teams — separate from the individual
// cert-count-based Plan in plans.ts. A clinic pays for a bucket of seats
// (like a phone plan's "up to N lines"), not per certificate tracked.
// Every member of a team gets full features (unlimited certs, renewal tips
// and links) regardless of which tier the org is on — see
// canUseTipsAndLinks/certLimit in store.ts. The org itself is what's
// seat-limited, via ORG_PLANS[plan].seatLimit.

export interface OrgPlanDetails {
  id: OrgPlan;
  name: string;
  tagline: string;
  seatLimit: number;
  priceMonthly: number;
  priceYearly: number;
}

export const ORG_TRIAL_DAYS = 7;

export const ORG_PLANS: Record<OrgPlan, OrgPlanDetails> = {
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "For small clinics just getting started.",
    seatLimit: 5,
    priceMonthly: 25,
    priceYearly: 270
  },
  team: {
    id: "team",
    name: "Team",
    tagline: "For growing practices.",
    seatLimit: 10,
    priceMonthly: 50,
    priceYearly: 540
  },
  clinic: {
    id: "clinic",
    name: "Clinic",
    tagline: "For established multi-provider clinics.",
    seatLimit: 25,
    priceMonthly: 125,
    priceYearly: 1350
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "For larger healthcare organizations.",
    seatLimit: 50,
    priceMonthly: 250,
    priceYearly: 2700
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For hospital networks and large staffing groups.",
    seatLimit: 100,
    priceMonthly: 500,
    priceYearly: 5400
  }
};

// Ordered smallest-to-largest, for rendering tier cards and for "is there a
// bigger tier to upgrade to" logic.
export const ORG_PLAN_ORDER: OrgPlan[] = ["starter", "team", "clinic", "business", "enterprise"];

export function orgPriceFor(plan: OrgPlan, billingCycle: BillingCycle): number {
  return billingCycle === "yearly" ? ORG_PLANS[plan].priceYearly : ORG_PLANS[plan].priceMonthly;
}

/** The smallest tier whose seat limit is still above `neededSeats`, if any —
 * used to suggest "upgrade to X" when a clinic hits its current limit. */
export function nextOrgPlanAbove(neededSeats: number): OrgPlan | null {
  return ORG_PLAN_ORDER.find((p) => ORG_PLANS[p].seatLimit > neededSeats) ?? null;
}
