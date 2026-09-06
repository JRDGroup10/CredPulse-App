import { describe, expect, it } from "vitest";
import { ORG_PLANS, ORG_PLAN_ORDER, nextOrgPlanAbove, orgPriceFor } from "./orgPlans";

describe("ORG_PLAN_ORDER", () => {
  it("lists every plan in ORG_PLANS exactly once, smallest seat limit first", () => {
    expect(new Set(ORG_PLAN_ORDER)).toEqual(new Set(Object.keys(ORG_PLANS)));
    const seatLimits = ORG_PLAN_ORDER.map((p) => ORG_PLANS[p].seatLimit);
    expect(seatLimits).toEqual([...seatLimits].sort((a, b) => a - b));
  });
});

describe("nextOrgPlanAbove", () => {
  it("suggests the next tier up when the current one is maxed out", () => {
    expect(nextOrgPlanAbove(5)).toBe("team");
    expect(nextOrgPlanAbove(10)).toBe("clinic");
  });

  it("returns null once nothing bigger exists", () => {
    expect(nextOrgPlanAbove(100)).toBeNull();
    expect(nextOrgPlanAbove(1000)).toBeNull();
  });
});

describe("orgPriceFor", () => {
  it("returns the monthly or yearly price matching the billing cycle", () => {
    expect(orgPriceFor("starter", "monthly")).toBe(ORG_PLANS.starter.priceMonthly);
    expect(orgPriceFor("starter", "yearly")).toBe(ORG_PLANS.starter.priceYearly);
  });
});
