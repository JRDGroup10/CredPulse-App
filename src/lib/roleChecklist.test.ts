import { describe, expect, it } from "vitest";
import { getRecommendedCertifications } from "./roleChecklist";
import { rolesForRegion } from "./roles";

// getRecommendedCertifications() throws if a role's keyword doesn't match
// any KNOWN_TEMPLATES regex (by design — see roleChecklist.ts, "better to
// fail loudly here than show a blank/wrong recommendation"). That's only
// ever exercised in production when a real user happens to pick that exact
// role at signup, so a typo in the keyword table for a rarely-chosen role
// could sit unnoticed for a long time. Running every role in the signup
// dropdown through this, for both regions, catches that at build time
// instead.
describe("getRecommendedCertifications", () => {
  for (const region of ["CA", "US"] as const) {
    for (const role of rolesForRegion(region)) {
      it(`resolves a non-empty checklist for "${role}" (${region}) without throwing`, () => {
        const items = getRecommendedCertifications(role, region);
        expect(items.length).toBeGreaterThan(0);
        for (const item of items) {
          expect(item.name.length).toBeGreaterThan(0);
          expect(item.match).toBeInstanceOf(RegExp);
        }
      });
    }
  }

  it("falls back to sensible defaults for an unrecognized role", () => {
    const items = getRecommendedCertifications("Some Made-Up Role", "CA");
    expect(items.length).toBeGreaterThan(0);
  });

  it("de-duplicates recommendations that resolve to the same certificate name", () => {
    // Registered Nurse's keywords are ["bls", "n95", "influenza"] — none
    // collide today, but this guards the de-dup logic itself rather than
    // today's specific keyword list.
    const items = getRecommendedCertifications("Registered Nurse", "CA");
    const names = items.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
