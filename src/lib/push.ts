// Push notifications for installed-PWA users. A device "subscribes" via the
// browser's Push API, and we save that subscription to Supabase
// (push_subscriptions table — see supabase/push-subscriptions-schema.sql).
// The send-reminders Edge Function reads that table and delivers a push
// notification alongside the existing email reminder, on the same schedule.
import { supabase } from "./supabaseClient";

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "").trim();

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

/**
 * True once every precondition for offering push is met: the browser
 * supports it, a VAPID key is configured, AND the app is actually running
 * installed (standalone) — matching how this was asked for ("if the person
 * has the site downloaded as an app"), not for anyone just visiting the site
 * in a regular browser tab.
 */
export function pushSupported(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
  return (
    standalone &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
}

export type PushStatus = "checking" | "subscribed" | "unsubscribed" | "denied" | "unsupported";

export async function getPushSubscriptionStatus(): Promise<PushStatus> {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  return sub ? "subscribed" : "unsubscribed";
}

export async function subscribeToPush(userId: string): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission wasn't granted.");
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast needed because TS's lib types are stricter than the DOM API
      // actually requires here (a plain Uint8Array is valid at runtime).
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Browser returned an incomplete push subscription.");
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth
    },
    { onConflict: "endpoint" }
  );
  if (error) throw error;
}

/** Sends one test push to every device this user is subscribed on — lets
 * Settings verify push actually works without waiting for a real
 * certificate to hit a reminder threshold. */
export async function sendTestPush(): Promise<{ sent: number }> {
  const { data, error } = await supabase.functions.invoke("send-test-push");
  if (error) throw error;
  return data as { sent: number };
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
