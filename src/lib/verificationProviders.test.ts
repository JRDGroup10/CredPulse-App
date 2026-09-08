import { describe, expect, it } from "vitest";
import { getVerificationLink } from "./verificationProviders";

// getVerificationLink() decides between a hand-verified official portal and
// a zero-risk generic search fallback — getting the matching wrong either
// sends someone to the wrong issuing body's verification tool (worse than no
// link at all) or silently drops a body that does have one.

describe("getVerificationLink", () => {
  it("matches BLS to the American Heart Association eCard tool", () => {
    const link = getVerificationLink("Basic Life Support (BLS)");
    expect(link.isOfficial).toBe(true);
    expect(link.url).toBe("https://www.heart.org/cpr/mycards");
    expect(link.label).toContain("American Heart Association");
  });

  it("matches ACLS and PALS to the same AHA tool as BLS", () => {
    expect(getVerificationLink("Advanced Cardiac Life Support (ACLS)").url).toBe("https://www.heart.org/cpr/mycards");
    expect(getVerificationLink("Pediatric Advanced Life Support (PALS)").url).toBe("https://www.heart.org/cpr/mycards");
  });

  it("matches PHTLS to NAEMT", () => {
    const link = getVerificationLink("Prehospital Trauma Life Support (PHTLS)");
    expect(link.isOfficial).toBe(true);
    expect(link.url).toBe("https://www.naemt.org/course-administration/verify-education-certificate");
  });

  it("matches NRP to the AAP's NRP learning platform", () => {
    const link = getVerificationLink("Neonatal Resuscitation Program (NRP)");
    expect(link.isOfficial).toBe(true);
    expect(link.url).toBe("https://nrplearningplatform.com/certificateAdmin/0.1/verify_certificate");
  });

  it("matches CRCST to HSPA's verify tool", () => {
    expect(getVerificationLink("Sterile Processing Certification (CRCST)").url).toBe("https://verify.myhspa.org/");
  });

  it("matches medical coding certification to AAPC's credential-verification tool", () => {
    expect(getVerificationLink("Medical Coding Certification").url).toBe(
      "https://www.aapc.com/certification/credential-verification.aspx"
    );
  });

  it("matches PANCE to NCCPA's verify portal", () => {
    expect(getVerificationLink("Physician Assistant Certification (PANCE)").url).toBe("https://portal.nccpa.net/verifypac");
  });

  it("matches crane operator certification to NCCCO's verify tool", () => {
    expect(getVerificationLink("Crane Operator Certification (NCCCO)").url).toBe("https://www.verifycco.org/");
  });

  it("falls back to a generic search link for ATLS — no public third-party verification tool exists", () => {
    const link = getVerificationLink("Advanced Trauma Life Support (ATLS)");
    expect(link.isOfficial).toBe(false);
    expect(link.url).toContain("google.com/search");
    expect(link.url).toContain(encodeURIComponent("Advanced Trauma Life Support (ATLS)"));
  });

  it("falls back to a generic search link for a certification with no known body at all", () => {
    const link = getVerificationLink("Some Made-Up Certification");
    expect(link.isOfficial).toBe(false);
    expect(link.url).toContain("google.com/search");
  });
});
