import { Certificate } from "./types";

/** Certificate names in this app's own templates (see mockExtract.ts)
 * routinely follow "Full Name (ABBR)" — extracts the ABBR so "BLS" typed on
 * its own still matches "Basic Life Support (BLS)". Only strings that were
 * actually parenthesized are treated as aliases; this deliberately does NOT
 * try to guess acronyms by taking initials, since that would just recreate
 * the same false-positive risk in reverse. */
function extractParenAlias(raw: string): string | null {
  const m = raw.match(/\(([A-Za-z0-9]{2,8})\)/);
  return m ? m[1].toLowerCase() : null;
}

function stripParen(raw: string): string {
  return raw.replace(/\([^)]*\)/g, " ");
}

/** Lowercases and collapses punctuation/whitespace so "CPR/AED" and
 * "cpr aed" compare equal. Run on text that's already had its parenthetical
 * stripped out (see stripParen) so the alias itself doesn't leak into the
 * "bare" name used for the rest of the comparison. */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()/.,-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Iterative Levenshtein distance — only ever run on short certificate-name
 * strings here, so the O(n*m) table is negligible. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

/**
 * True if two certificate names are likely referring to the same real-world
 * credential. Checks, in order:
 *  1. Exact match once punctuation/case differences are normalized away.
 *  2. One name's parenthesized alias equals the other's bare name (or
 *     alias) — "BLS" vs "Basic Life Support (BLS)".
 *  3. A small number of character edits, scaled to length — typos like
 *     "Naloxone Administartion" vs "Naloxone Administration".
 *  4. One bare name is a prefix of the other and everything after the
 *     shared part is just digits/whitespace — the same cert re-added with
 *     a year or cycle number tacked on, e.g. "N95 Fit Test" vs "N95 Fit
 *     Test 2026".
 *
 * Deliberately does NOT treat "one name contains the other" as a match on
 * its own — "First Aid" is a substring of "Mental Health First Aid," but
 * those are genuinely different certifications (both appear in this app's
 * own template list), and a generic substring rule would flag that pair as
 * duplicates on every single add.
 */
export function areSimilarCertNames(a: string, b: string): boolean {
  const aliasA = extractParenAlias(a);
  const aliasB = extractParenAlias(b);
  const bareA = normalize(stripParen(a));
  const bareB = normalize(stripParen(b));
  if (!bareA || !bareB) return false;

  if (bareA === bareB) return true;
  if (aliasA && (aliasA === bareB || aliasA === aliasB)) return true;
  if (aliasB && aliasB === bareA) return true;

  const maxLen = Math.max(bareA.length, bareB.length);
  const maxDistance = Math.max(1, Math.floor(maxLen / 8));
  if (levenshtein(bareA, bareB) <= maxDistance) return true;

  const [shorter, longer] = bareA.length <= bareB.length ? [bareA, bareB] : [bareB, bareA];
  if (shorter.length >= 4 && longer.startsWith(shorter)) {
    const extra = longer.slice(shorter.length);
    if (/^[\s0-9]*$/.test(extra)) return true;
  }

  return false;
}

/** Finds the first certificate already on file whose name looks like the
 * same credential as `name` — used by AddCertificate.tsx to warn before
 * someone creates a second record for something they already track,
 * instead of silently letting duplicates pile up. Not scoped to
 * clinic/personal — the same real-world credential re-entered under the
 * other scope by mistake is just as much a duplicate. */
export function findLikelyDuplicate(name: string, existing: Certificate[]): Certificate | null {
  const trimmed = name.trim();
  if (trimmed.length < 3) return null;
  return existing.find((c) => areSimilarCertNames(trimmed, c.name)) ?? null;
}
