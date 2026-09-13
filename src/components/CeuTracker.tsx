import { useEffect, useState } from "react";
import { useAppState } from "../lib/AppContext";
import { addCeuCredit, deleteCeuCredit, listCeuCredits, sumCeuCredits } from "../lib/store";
import { CeuCreditLog } from "../lib/types";
import { reportError } from "../lib/errorMonitoring";

// CE-credit tracking — see supabase/ceu-tracking-schema.sql for why this is
// a genuinely different tracking problem from a hard-expiry certification
// like BLS: it's "earn N credits by this date," not "renew before this
// date." Only rendered by CertCard.tsx when cert.ceuRequired is set (opted
// into at add-time in AddCertificate.tsx).
export default function CeuTracker({ certificateId, ceuRequired }: { certificateId: string; ceuRequired: number }) {
  const { userId } = useAppState();
  const [logs, setLogs] = useState<CeuCreditLog[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [credits, setCredits] = useState("");
  const [completedDate, setCompletedDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listCeuCredits(certificateId)
      .then((result) => {
        if (!cancelled) setLogs(result);
      })
      .catch((err) => {
        reportError(err, { context: "CeuTracker.load", certificateId });
        if (!cancelled) setLogs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [certificateId]);

  const earned = sumCeuCredits(logs ?? []);
  const pct = ceuRequired > 0 ? Math.min(100, Math.round((earned / ceuRequired) * 100)) : 0;
  const shortfall = Math.max(0, ceuRequired - earned);
  const metGoal = shortfall === 0 && earned > 0;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(credits);
    if (!n || n <= 0 || !completedDate) {
      setError("Enter a positive credit amount and a date.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addCeuCredit(certificateId, userId, { credits: n, activityName: activityName.trim(), completedDate });
      setLogs(await listCeuCredits(certificateId));
      setActivityName("");
      setCredits("");
      setCompletedDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't log that credit — try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const previous = logs;
    setLogs((prev) => (prev ?? []).filter((l) => l.id !== id));
    try {
      await deleteCeuCredit(id);
    } catch (err) {
      reportError(err, { context: "CeuTracker.delete", certificateId, logId: id });
      setLogs(previous ?? null);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-hairline/70 dark:border-hairline/10">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="w-full text-left group/ceu">
        <div className="flex items-center justify-between text-caption mb-1.5">
          <span className="font-medium text-ink-muted">
            CE credits: {earned} / {ceuRequired}
          </span>
          <span className="text-ink-faint group-hover/ceu:text-ink-muted">
            {expanded ? "Hide" : "Log credit →"}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-ink/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${metGoal ? "bg-emerald-500" : "bg-amber-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 animate-fade-in">
          {!metGoal && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              {shortfall} credit{shortfall === 1 ? "" : "s"} still needed before this renews.
            </p>
          )}
          {metGoal && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
              Requirement met — log any additional credits for your own records.
            </p>
          )}

          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[8rem]">
              <label htmlFor={`ceu-activity-${certificateId}`} className="block text-[10px] text-ink-faint mb-1">Activity</label>
              <input
                id={`ceu-activity-${certificateId}`}
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="e.g. Online module"
                className="w-full text-caption border border-hairline dark:border-hairline/15 bg-panel text-ink placeholder:text-ink-muted rounded-ui px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
              />
            </div>
            <div className="w-16">
              <label htmlFor={`ceu-credits-${certificateId}`} className="block text-[10px] text-ink-faint mb-1">Credits</label>
              <input
                id={`ceu-credits-${certificateId}`}
                type="number"
                step="0.5"
                min="0"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full text-caption border border-hairline dark:border-hairline/15 bg-panel text-ink rounded-ui px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
              />
            </div>
            <div className="w-32">
              <label htmlFor={`ceu-date-${certificateId}`} className="block text-[10px] text-ink-faint mb-1">Date completed</label>
              <input
                id={`ceu-date-${certificateId}`}
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
                className="w-full text-caption border border-hairline dark:border-hairline/15 bg-panel text-ink rounded-ui px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary text-caption px-3 py-1.5 disabled:opacity-50">
              {saving ? "Adding…" : "Add"}
            </button>
          </form>
          {error && <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>}

          {logs && logs.length > 0 && (
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-2 text-[11px] text-ink-faint"
                >
                  <span className="truncate">
                    {log.activityName || "Credit"} · {log.credits} · {log.completedDate}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(log.id)}
                    className="text-red-500 hover:text-red-600 dark:hover:text-red-300 flex-shrink-0"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
