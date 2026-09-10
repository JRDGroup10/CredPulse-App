import { useEffect, useState } from "react";
import { useAppState } from "../lib/AppContext";
import { getReferralSummary, certLimit } from "../lib/store";
import { ReferralSummary } from "../lib/types";
import { reportError } from "../lib/errorMonitoring";

const SITE_URL = "https://credpulse.app";

// Referral/viral-loop feature — see supabase/referrals-schema.sql for the
// schema and reward logic, lib/referralCapture.ts for how a "?ref=" link
// gets carried through signup, and store.ts's getReferralSummary()/
// certLimit() for how the bonus actually raises what a free/plus/pro
// account can track. This card is purely a read-and-share surface; nothing
// here writes any data itself.
export default function ReferralCard() {
  const { userId, state } = useAppState();
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getReferralSummary(state, userId)
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch((err) => {
        reportError(err, { context: "ReferralCard.load" });
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loadError || !summary) return null;

  const link = `${SITE_URL}/?ref=${summary.referralCode}`;
  const atCap = summary.bonusCertSlots >= summary.maxBonusCertSlots;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="font-medium text-ink">Invite a friend</h2>
          <p className="text-caption text-ink-muted mt-0.5">
            Share your link — when someone signs up through it, you get a bonus certificate slot.
          </p>
        </div>
        <span className="flex-shrink-0 text-2xl">🎁</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 text-caption font-mono bg-panel border border-hairline dark:border-hairline/15 text-ink-muted rounded-ui px-3 py-2 truncate"
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="btn-primary flex-shrink-0 text-caption px-3 py-2"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between text-caption pt-3 border-t border-hairline/70 dark:border-hairline/10">
        <div className="text-ink-muted">
          <span className="font-medium text-ink">{summary.referralCount}</span>{" "}
          {summary.referralCount === 1 ? "friend" : "friends"} referred
        </div>
        <div className="text-ink-muted">
          <span className="font-medium text-ink">
            +{summary.bonusCertSlots}
          </span>{" "}
          bonus slot{summary.bonusCertSlots === 1 ? "" : "s"} earned
          {atCap && " (max reached)"}
          {" · "}
          {certLimit(state) === Infinity ? "unlimited" : certLimit(state)} total on your plan now
        </div>
      </div>
    </div>
  );
}
