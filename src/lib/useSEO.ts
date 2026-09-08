import { useEffect } from "react";

const SITE_URL = "https://credpulse.app";

interface SEOOptions {
  title: string;
  description: string;
  /** Path only, e.g. "/industries" — combined with SITE_URL to build the
   * canonical URL and og:url/twitter equivalents. */
  path: string;
}

function setMetaContent(selector: string, value: string): void {
  document.head.querySelector(selector)?.setAttribute("content", value);
}

/**
 * Updates <title>, the meta description, the canonical link, and the
 * Open Graph/Twitter tags for whichever page calls this.
 *
 * Why this exists: CredPulse is a client-rendered SPA served from one
 * static index.html, which hardcodes a single, healthcare-specific title/
 * description/canonical URL (all pointing at "/"). Without this hook,
 * every route — including /industries, which is a completely different
 * pitch for construction/education/policing teams — inherited those exact
 * same tags. That's a real SEO bug, not just a cosmetic one: it told
 * Google that /industries was a duplicate of the homepage with a
 * description that doesn't match its actual content, which actively hurts
 * (rather than just fails to help) that page's ability to rank for its own
 * audience's search terms.
 *
 * Call this once near the top of any top-level public page that should be
 * indexed as its own distinct thing (Landing, Industries, the legal pages).
 * Funnel-only pages with no unique content of their own (the industry
 * chooser, the team-invite landing page, etc.) deliberately don't call
 * this — they're fine inheriting index.html's defaults, since they aren't
 * meant to rank on their own anyway.
 */
export function useSEO({ title, description, path }: SEOOptions): void {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    document.title = title;
    setMetaContent('meta[name="description"]', description);
    document.head.querySelector('link[rel="canonical"]')?.setAttribute("href", url);
    setMetaContent('meta[property="og:title"]', title);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[property="og:url"]', url);
    setMetaContent('meta[name="twitter:title"]', title);
    setMetaContent('meta[name="twitter:description"]', description);
  }, [title, description, path]);
}
