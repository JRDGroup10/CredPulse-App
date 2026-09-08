// Captures a "?ref=<code>" query param from a shared referral link (see
// getReferralSummary()/Settings.tsx for where that link comes from) and
// carries it through to signUp() even though several redirects/screens can
// sit between the visitor landing on the link and actually submitting the
// signup form — same reasoning as industryPref.ts and pendingClinicSetup.ts:
// a query param doesn't survive client-side navigation on its own, so it
// has to be parked in localStorage the moment it's seen.
const KEY = "credpulse:referralCode";

/** Call once on app boot (see App.tsx). No-ops if there's no ?ref= param,
 * so it's always safe to call on every page load regardless of route. */
export function captureReferralFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && ref.trim()) {
      localStorage.setItem(KEY, ref.trim().toUpperCase());
    }
  } catch {
    // Private browsing / storage disabled — the referral simply won't be
    // credited. Not worth surfacing an error for what's a growth-loop nicety.
  }
}

/** Reads (without clearing) the captured code, if any — used to show a
 * "you were invited" hint on the signup form. */
export function peekReferralCode(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Reads and clears the captured code — called once signUp() actually
 * succeeds, so a stale code never gets attributed to a later, unrelated
 * signup in the same browser (e.g. someone else using a shared computer). */
export function consumeReferralCode(): string | null {
  try {
    const code = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    return code;
  } catch {
    return null;
  }
}
