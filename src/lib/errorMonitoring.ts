import * as Sentry from "@sentry/react";

// Mirrors supabaseClient.ts's pattern exactly: if VITE_SENTRY_DSN isn't set,
// this degrades to a silent no-op (console.error only) instead of throwing
// or leaving the app half-configured — so cloning this repo and running it
// locally with no Sentry account at all still works fine, same as every
// other optional integration in this app (Stripe, push, AI extraction).
const dsn = (import.meta.env.VITE_SENTRY_DSN ?? "").trim();
export const errorMonitoringConfigured = dsn.length > 0;

/** Call once, before rendering the app (see main.tsx). */
export function initErrorMonitoring(): void {
  if (!errorMonitoringConfigured) {
    console.warn(
      "[CredPulse] VITE_SENTRY_DSN isn't set — runtime errors will only show in this browser's own " +
        "console instead of being reported anywhere. See README for how to add error monitoring."
    );
    return;
  }
  Sentry.init({
    dsn,
    // Session Replay and full tracing cost real Sentry quota for comparatively
    // little value on an app this size right now — start with plain error
    // capture, and turn these on later if/when they're worth the noise.
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0
  });
}

/** Reports one error out-of-band (e.g. from ErrorBoundary.tsx or a caught
 * async rejection) — always safe to call even when monitoring isn't
 * configured, in which case it just logs locally instead. `context` is
 * attached as extra data in Sentry so a report says which part of the app
 * it came from, not just a bare stack trace. */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (errorMonitoringConfigured) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  } else {
    console.error("[CredPulse] Unhandled error:", error, context ?? "");
  }
}
