// Google Analytics 4 wrapper. Mirrors errorMonitoring.ts's pattern exactly:
// if VITE_GA_MEASUREMENT_ID isn't set, every function here degrades to a
// silent no-op instead of throwing or leaving the app half-configured — so
// cloning this repo and running it locally with no GA property at all still
// works fine, same as every other optional integration in this app (Stripe,
// Sentry, push, AI extraction).
//
// This is a from-scratch gtag.js loader rather than the react-ga4 package —
// GA4's actual JS API surface is three functions (load the script, call
// gtag('config', ...), call gtag('event', ...)), so a dependency buys
// nothing here that isn't already this file.

const measurementId = (import.meta.env.VITE_GA_MEASUREMENT_ID ?? "").trim();
export const analyticsConfigured = measurementId.length > 0;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

/** Call once, before the first route renders (see App.tsx). Injects
 * gtag.js and configures it with page_view sending turned off — App.tsx's
 * own trackPageview() call sends the first (and every subsequent) page_view
 * instead, so a single-page app doesn't double-count the initial load. */
export function initAnalytics(): void {
  if (!analyticsConfigured) {
    console.warn(
      "[CredPulse] VITE_GA_MEASUREMENT_ID isn't set — page views and product events won't be tracked " +
        "anywhere. See README for how to add Google Analytics."
    );
    return;
  }
  if (initialized) return;
  initialized = true;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

/** Records one page view. Call on every route change (both the pre-auth
 * marketing routes and the authenticated app's routes) — see the
 * useEffect in App.tsx's Routed(). Safe to call even when analytics isn't
 * configured. */
export function trackPageview(path: string): void {
  if (!analyticsConfigured || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title
  });
}

/** Records one product event (signup, invite sent, certificate added,
 * etc.). `params` become GA4 event parameters — keep keys snake_case to
 * match GA4's own convention and so they show up cleanly in reports
 * without needing custom dimension remapping. Safe to call even when
 * analytics isn't configured. */
export function trackEvent(name: string, params?: Record<string, string | number | boolean>): void {
  if (!analyticsConfigured || !window.gtag) return;
  window.gtag("event", name, params);
}
