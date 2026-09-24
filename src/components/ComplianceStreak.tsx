import { useMemo } from "react";
import { useAppState } from "../lib/AppContext";
import { statusFor } from "../lib/store";

function daysBetween(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

// Lightweight gamification: shows how long the user has gone without any
// currently-tracked certificate sitting in "expired" status. We don't keep
// a history of past lapses once a cert is renewed/replaced, so the streak
// length is approximated as "days since the oldest certificate currently
// being tracked was issued" — an honest, if imperfect, proxy given what the
// app actually stores. Resets (visually) the moment anything is expired.
export default function ComplianceStreak() {
  const { state } = useAppState();
  const { certificates } = state;

  const { streakDays, hasLapse, hasCerts, expiredCount } = useMemo(() => {
    if (certificates.length === 0) {
      return { streakDays: 0, hasLapse: false, hasCerts: false, expiredCount: 0 };
    }
    const expired = certificates.filter((c) => statusFor(c.expiryDate) === "expired").length;
    const oldest = certificates.reduce(
      (earliest, c) => (c.issuedDate < earliest ? c.issuedDate : earliest),
      certificates[0].issuedDate
    );
    const days = daysBetween(new Date(oldest), new Date());
    return { streakDays: days, hasLapse: expired > 0, hasCerts: true, expiredCount: expired };
  }, [certificates]);

  if (!hasCerts) return null;

  return (
    <div
      className={`mb-6 rounded-xl border px-4 py-3 text-sm flex items-center gap-3 ${
        hasLapse
          ? "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300"
          : "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
      }`}
    >
      <div className="text-xl leading-none">{hasLapse ? "⏸" : "🔥"}</div>
      <div>
        {hasLapse ? (
          <>
            <div className="font-medium">Streak paused</div>
            <div className="opacity-80 text-xs mt-0.5">
              Renew your expired certification{expiredCount > 1 ? "s" : ""} to start a new streak.
            </div>
          </>
        ) : (
          <>
            <div className="font-medium">{streakDays.toLocaleString()}-day streak</div>
            <div className="opacity-80 text-xs mt-0.5">Zero lapsed certifications. Keep it going.</div>
          </>
        )}
      </div>
    </div>
  );
}
