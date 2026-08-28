/* CredPulse service worker.
 *
 * This replaces vite-plugin-pwa's default auto-generated service worker (the
 * "injectManifest" strategy — see vite.config.ts) so we can add push
 * notification handling for certificate-expiry reminders, on top of the same
 * offline precaching the generated one gave us.
 *
 * NOTE: this file is intentionally excluded from `tsc -b` (see
 * tsconfig.json's "exclude") — service worker globals (self,
 * ServiceWorkerGlobalScope, PushEvent, etc.) conflict with the DOM lib the
 * rest of the app uses. vite-plugin-pwa still bundles this file with esbuild
 * at build time regardless, which strips types without type-checking, so
 * that's safe.
 */
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ---- Push notifications: certificate expiry reminders ----
// Sent by the send-reminders Edge Function (supabase/functions/send-reminders)
// to any device that's subscribed via src/lib/push.ts. Payload shape:
// { title: string, body: string, url?: string }

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "CredPulse", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "CredPulse";
  const options = {
    body: payload.body || "You have a certification that needs attention.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url || "/" }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
