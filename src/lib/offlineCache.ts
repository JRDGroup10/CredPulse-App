import { AppState } from "./types";

// Offline viewing: certificates and renewal dates are exactly the kind of
// thing someone might need to check with no signal (a hospital basement, a
// job site, a moving vehicle) — showing "something went wrong" instead of
// their own last-synced data is a worse failure mode than showing slightly
// stale data with a clear "last synced" timestamp. This never replaces a
// live load when one succeeds; it's purely a fallback for when loadState()
// in store.ts throws (see AppContext.tsx's loadFor()).
//
// Keyed by user id (not one global slot) so that if a different person
// signs into the same browser while offline, AppContext.tsx never hands
// them the previous user's cached certificates before their own network
// call has had a chance to succeed or fail on its own.

const KEY_PREFIX = "credpulse:offlineSnapshot:";

interface StoredSnapshot {
  state: AppState;
  syncedAt: string; // ISO timestamp of when this was last a real, live load
}

export function saveOfflineSnapshot(userId: string, state: AppState): void {
  try {
    const payload: StoredSnapshot = { state, syncedAt: new Date().toISOString() };
    localStorage.setItem(KEY_PREFIX + userId, JSON.stringify(payload));
  } catch {
    // Private-browsing/quota-exceeded storage failures degrade to "no
    // offline fallback available" — not worth surfacing over what's
    // already a nice-to-have on top of the real, live data path.
  }
}

export function loadOfflineSnapshot(userId: string): StoredSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + userId);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSnapshot;
  } catch {
    return null;
  }
}

export function clearOfflineSnapshot(userId: string): void {
  try {
    localStorage.removeItem(KEY_PREFIX + userId);
  } catch {
    // no-op — nothing meaningful to recover from here.
  }
}
