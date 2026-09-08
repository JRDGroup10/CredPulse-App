// Regulatory-body verification — links to the issuing body's own public
// tool for independently checking that a certification is real and current.
// This is a deliberately separate, smaller lookup than mockExtract.ts's
// KNOWN_TEMPLATES: KNOWN_TEMPLATES's renewalUrl points to where you go to
// *renew* a certification; the URLs here point to a genuinely different
// page — the issuing body's public verification/lookup tool, meant for a
// third party (a manager, an auditor) to check someone else's credential,
// not to book a course. Every URL below was fetched and confirmed live
// before being hardcoded here (2026-09-08). Bodies with no public
// third-party verification tool — ATLS/ACS only offers the certificate
// holder their own transcript login (MyCME), not a lookup anyone else can
// use — are deliberately left out; the generic search fallback covers those
// instead, same pattern as renewalSearch.ts uses for renewal links.
//
// This pairs with supabase/regulatory-verification-schema.sql, which adds
// the actual attestation trail (verified_at/verified_by on certificates) —
// a link alone doesn't record that anyone checked it, so Team.tsx uses both:
// this link to make checking easy, and markCertificateVerified() to record
// that a manager did.

interface VerificationPortal {
  match: RegExp;
  url: string;
  label: string; // the issuing body's name, for UI copy
}

const VERIFICATION_PORTALS: VerificationPortal[] = [
  {
    match: /bls|acls|pals|basic.life|advanced.cardiac|pediatric.advanced/i,
    url: "https://www.heart.org/cpr/mycards",
    label: "American Heart Association"
  },
  {
    match: /phtls|prehospital.trauma/i,
    url: "https://www.naemt.org/course-administration/verify-education-certificate",
    label: "NAEMT"
  },
  {
    match: /nrp|neonatal.resuscitation/i,
    url: "https://nrplearningplatform.com/certificateAdmin/0.1/verify_certificate",
    label: "American Academy of Pediatrics"
  },
  {
    match: /crcst|sterile.processing/i,
    url: "https://verify.myhspa.org/",
    label: "HSPA"
  },
  {
    match: /coding.certif|cpc|medical.billing/i,
    url: "https://www.aapc.com/certification/credential-verification.aspx",
    label: "AAPC"
  },
  {
    match: /pance|nccpa|physician.assistant.certif/i,
    url: "https://portal.nccpa.net/verifypac",
    label: "NCCPA"
  },
  {
    match: /crane.operator/i,
    url: "https://www.verifycco.org/",
    label: "NCCCO"
  }
];

function findVerificationPortal(certName: string): VerificationPortal | null {
  return VERIFICATION_PORTALS.find((p) => p.match.test(certName)) ?? null;
}

// Zero-risk fallback for every certification without a known public
// verification tool — never hardcodes an organization's URL, so unlike the
// portals above it can never go stale or point to the wrong body.
function buildVerificationSearchUrl(certName: string): string {
  const query = `verify ${certName} certification`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export interface VerificationLink {
  url: string;
  label: string;
  /** True when this is a specific, hand-verified official portal; false
   * when it's the generic search fallback. Team.tsx uses this to decide
   * whether to show the issuing body's name or just "Search for a way to
   * verify this". */
  isOfficial: boolean;
}

export function getVerificationLink(certName: string): VerificationLink {
  const portal = findVerificationPortal(certName);
  if (portal) {
    return { url: portal.url, label: `Check with ${portal.label}`, isOfficial: true };
  }
  return { url: buildVerificationSearchUrl(certName), label: "Search for a verification tool", isOfficial: false };
}
