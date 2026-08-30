// Which side of the homepage split-screen chooser (see IndustryChooser.tsx)
// a visitor picked — Healthcare vs. every other industry (construction,
// education, policing, etc). Purely a marketing/UX preference stored on this
// device; it never touches the account or backend, which is identical
// either way. Persisted so a returning visitor lands directly on their
// industry's page instead of re-choosing every visit — see App.tsx's
// unauthenticated "/" fallback.
export type IndustryPref = "healthcare" | "other";

const KEY = "credpulse:industryPref";

export function getIndustryPref(): IndustryPref | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "healthcare" || v === "other" ? v : null;
  } catch {
    return null;
  }
}

export function setIndustryPref(pref: IndustryPref): void {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    // Private browsing / storage disabled — the chooser just re-shows next
    // visit instead of remembering. Not worth surfacing an error for.
  }
}

/** Where the in-app "Home" button/link should point, based on the visitor's
 * remembered industry — used by Layout.tsx and AccountMenu.tsx so someone
 * who came in through the construction/education/policing side doesn't get
 * bounced back to the healthcare-flavored marketing page. */
export function marketingHomePath(): string {
  return getIndustryPref() === "other" ? "/industries" : "/home";
}
