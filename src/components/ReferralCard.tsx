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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="font-medium text-slate-900 dark:text-slate-50">Invite a friend</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Share your link — when someone signs up through it, you both get a bonus certificate slot.
          </p>
        </div>
        <span className="flex-shrink-0 text-2xl">🎁</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg px-3 py-2 truncate"
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex-shrink-0 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{summary.referralCount}</span>{" "}
          {summary.referralCount === 1 ? "friend" : "friends"} referred
        </div>
        <div className="text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
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
