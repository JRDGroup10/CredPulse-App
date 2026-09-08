// Generic "find where to renew this" fallback link.
//
// KNOWN_TEMPLATES (mockExtract.ts) already attaches a specific, hand-verified
// renewalUrl for certifications with one clear national certifying body (AHA,
// NAEMT, ACS, AAP, HSPA, AAPC, NCCPA, NCCCO, and others). But two kinds of
// certificates never get one:
//   1. Anything the template matcher doesn't recognize — a real AI extraction
//      of an unusual cert, or a name that just doesn't match any regex.
//   2. Certs that are deliberately jurisdiction/employer-specific by nature
//      (Working at Heights, Food Handler, Use of Force, etc.) where there's
//      no single "the" official body to link to.
//
// For those, rather than showing nothing, we build a search-engine query for
// "<cert name> renewal course near me". This is a zero-verification, zero-
// staleness-risk fallback: it never hardcodes a specific organization's URL,
// so it can never go stale or point to the wrong body the way a hand-picked
// link can. It's always shown alongside the specific link (when one exists),
// never instead of it.
export function buildRenewalSearchUrl(certName: string): string {
  const query = `${certName} renewal course near me`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
