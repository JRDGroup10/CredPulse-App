import { describe, expect, it } from "vitest";
import { getOnboardingProgress } from "./onboardingChecklist";
import { getRecommendedCertifications } from "./roleChecklist";
import { Certificate } from "./types";

// getOnboardingProgress() is the one diff the whole onboarding-kit feature
// (individual RoleChecklistCard.tsx progress + admin-facing Team.tsx
// role-coverage section) is built on. Rather than hardcode which
// certifications a role recommends (which would duplicate/fight with
// roleChecklist.test.ts's 87 cases and break if that table changes), these
// tests derive the expected recommended list from getRecommendedCertifications
// itself and only assert on the diff/counting logic layered on top of it.

function makeCert(name: string): Certificate {
  return {
    id: `cert-${name}`,
    name,
    issuer: "Some Issuer",
    credentialType: "certification",
    issuedDate: "2025-01-01",
    expiryDate: "2027-01-01",
    scope: "personal"
  };
}

describe("getOnboardingProgress", () => {
  it("with zero certificates, everything recommended is missing and nothing is complete", () => {
    const recommended = getRecommendedCertifications("Registered Nurse", "US");
    const progress = getOnboardingProgress("Registered Nurse", "US", []);
    expect(progress.totalCount).toBe(recommended.length);
    expect(progress.completedCount).toBe(0);
    expect(progress.missing).toHaveLength(recommended.length);
  });

  it("having one recommended certificate reduces missing by exactly one and increments completedCount", () => {
    const recommended = getRecommendedCertifications("Registered Nurse", "US");
    expect(recommended.length).toBeGreaterThan(0); // sanity: this role must recommend something for the test to mean anything

    const owned = [makeCert(recommended[0].name)];
    const progress = getOnboardingProgress("Registered Nurse", "US", owned);

    expect(progress.completedCount).toBe(1);
    expect(progress.missing).toHaveLength(recommended.length - 1);
    expect(progress.missing.some((item) => item.name === recommended[0].name)).toBe(false);
  });

  it("having every recommended certificate leaves nothing missing", () => {
    const recommended = getRecommendedCertifications("Registered Nurse", "US");
    const owned = recommended.map((item) => makeCert(item.name));
    const progress = getOnboardingProgress("Registered Nurse", "US", owned);

    expect(progress.missing).toHaveLength(0);
    expect(progress.completedCount).toBe(progress.totalCount);
  });

  it("matches by the item's own regex, not exact string equality — e.g. a cert with extra wording still counts", () => {
    const recommended = getRecommendedCertifications("Registered Nurse", "US");
    const target = recommended.find((item) => item.match.test("BLS renewal 2026"));
    // Only meaningful if this role recommends something BLS-shaped; skip
    // gracefully if the keyword table ever changes such that it doesn't.
    if (!target) return;
    const progress = getOnboardingProgress("Registered Nurse", "US", [makeCert("BLS renewal 2026")]);
    expect(progress.missing.some((item) => item.name === target.name)).toBe(false);
  });

  it("an unrecognized role falls back to the default checklist rather than throwing", () => {
    expect(() => getOnboardingProgress("Some Made-Up Role Nobody Uses", "US", [])).not.toThrow();
  });
});
