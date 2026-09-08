import { useAppState } from "../lib/AppContext";

/**
 * Full-width banner shown whenever the currently-displayed data came from
 * the offline snapshot (lib/offlineCache.ts) instead of a live load — i.e.
 * the last attempt to reach Supabase failed, most likely because there's no
 * network connection right now. Rendered in Layout.tsx so it's visible from
 * any page, same slot as TeamInviteBanner.
 *
 * There's no dismiss button here on purpose: the underlying condition
 * (showing stale data) doesn't go away just because someone closes the
 * banner, and AppContext.tsx already clears offlineSyncedAt back to null
 * the moment a live load succeeds again — so this disappears on its own as
 * soon as the connection is back, with no state to manage here.
 */
export default function OfflineBanner() {
  const { offlineSyncedAt } = useAppState();

  if (!offlineSyncedAt) return null;

  const syncedLabel = new Date(offlineSyncedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

  return (
    <div className="bg-amber-500 text-white">
      <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-2 text-sm">
        <span aria-hidden="true">📡</span>
        <span>
          You're offline — showing certificates saved as of <span className="font-semibold">{syncedLabel}</span>.
        </span>
      </div>
    </div>
  );
}
