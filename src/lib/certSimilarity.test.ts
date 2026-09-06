import { describe, expect, it } from "vitest";
import { areSimilarCertNames, findLikelyDuplicate } from "./certSimilarity";
import { Certificate } from "./types";

// Regression cases from the redundant-cert-detection feature — several of
// these were real bugs caught during manual testing before this suite
// existed (see "First Aid" vs "Mental Health First Aid" below, a genuine
// false positive from an earlier version of the substring-match logic).
describe("areSimilarCertNames", () => {
  it("matches an abbreviation to its parenthesized full name", () => {
    expect(areSimilarCertNames("Basic Life Support (BLS)", "BLS")).toBe(true);
    expect(areSimilarCertNames("Neonatal Resuscitation Program (NRP)", "NRP")).toBe(true);
    expect(areSimilarCertNames("Crisis Intervention Training (CIT)", "CIT")).toBe(true);
  });

  it("matches names that only differ by punctuation/case", () => {
    expect(areSimilarCertNames("CPR/AED", "cpr aed")).toBe(true);
  });

  it("matches close typos", () => {
    expect(areSimilarCertNames("Naloxone Administration", "Naloxone Administartion")).toBe(true);
    expect(areSimilarCertNames("Firearms Qualification", "Firearms Requalification")).toBe(true);
  });

  it("matches the same cert re-entered with a year/version appended", () => {
    expect(areSimilarCertNames("N95 Fit Test", "N95 Fit Test 2026")).toBe(true);
  });

  it("does NOT match genuinely different certifications that share words", () => {
    // The false positive that motivated tightening the substring rule —
    // both of these are real, distinct entries in KNOWN_TEMPLATES.
    expect(areSimilarCertNames("First Aid", "Mental Health First Aid")).toBe(false);
    expect(areSimilarCertNames("Use of Force Recertification", "Use of Force")).toBe(false);
  });

  it("does NOT match unrelated certifications", () => {
    expect(areSimilarCertNames("Advanced Cardiac Life Support (ACLS)", "Basic Life Support (BLS)")).toBe(false);
    expect(areSimilarCertNames("Forklift Certification", "Crane Operator Certification")).toBe(false);
  });

  it("treats empty strings as never similar", () => {
    expect(areSimilarCertNames("", "BLS")).toBe(false);
    expect(areSimilarCertNames("BLS", "")).toBe(false);
  });
});

function cert(overrides: Partial<Certificate>): Certificate {
  return {
    id: "id-1",
    name: "Basic Life Support (BLS)",
    issuer: "American Heart Association",
    credentialType: "certification",
    issuedDate: "2024-01-01",
    expiryDate: "2026-01-01",
    scope: "personal",
    ...overrides
  };
}

describe("findLikelyDuplicate", () => {
  it("finds an existing certificate with a similar name", () => {
    const existing = [cert({ id: "existing-1" })];
    const match = findLikelyDuplicate("BLS", existing);
    expect(match?.id).toBe("existing-1");
  });

  it("returns null when nothing matches", () => {
    const existing = [cert({ name: "Forklift Operator Certification" })];
    expect(findLikelyDuplicate("Crane Operator Certification", existing)).toBeNull();
  });

  it("returns null for very short names to avoid noisy matches", () => {
    const existing = [cert({ name: "CPR" })];
    expect(findLikelyDuplicate("CP", existing)).toBeNull();
  });

  it("returns null against an empty list", () => {
    expect(findLikelyDuplicate("BLS", [])).toBeNull();
  });
});
