// Meta Pixel wrapper. Mirrors analytics.ts's (GA4) and errorMonitoring.ts's
// pattern exactly: if VITE_META_PIXEL_ID isn't set, every function here
// degrades to a silent no-op instead of throwing or leaving the app
// half-configured — same as every other optional integration in this app
// (GA4, Sentry, Stripe, push, AI extraction).
//
// This exists specifically to let Meta (Facebook/Instagram) Ads optimize
// for and report on real signups on credpulse.app, rather than just clicks
// or page views — see trackPixelEvent("CompleteRegistration", ...) calls
// at the same signup-completion points GA4's trackEvent("sign_up", ...)
// already fires from (Auth.tsx, ClinicSignup.tsx).

const pixelId = (import.meta.env.VITE_META_PIXEL_ID ?? "").trim();
export const metaPixelConfigured = pixelId.length > 0;

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string };
    _fbq?: unknown;
  }
}

let initialized = false;

/** Call once, before the first route renders (see main.tsx). Injects the
 * standard Meta Pixel base code and fires the initial PageView. Safe to
 * call even when VITE_META_PIXEL_ID isn't set. */
export function initMetaPixel(): void {
  if (!metaPixelConfigured) {
    console.warn(
      "[CredPulse] VITE_META_PIXEL_ID isn't set — Meta (Facebook/Instagram) ad conversions won't be " +
        "tracked. See README for how to add the Meta Pixel."
    );
    return;
  }
  if (initialized) return;
  initialized = true;

  // This is Meta's own standard base-code snippet, transcribed as-is (just
  // without the inline <script> wrapper, since it runs from a TS module
  // here instead) — see Events Manager > Data Sources > [pixel] > Settings
  // if this ever needs to be regenerated.
  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  window.fbq!("init", pixelId);
  window.fbq!("track", "PageView");
}

/** Records one standard or custom Meta Pixel event (CompleteRegistration,
 * InitiateCheckout, Lead, etc.) — see
 * https://www.facebook.com/business/help/402791146561655 for the standard
 * event names Meta's ad optimization and reporting understand natively.
 * `params` become Meta event parameters. Safe to call even when the pixel
 * isn't configured. */
export function trackPixelEvent(name: string, params?: Record<string, string | number | boolean>): void {
  if (!metaPixelConfigured || !window.fbq) return;
  window.fbq("track", name, params);
}
