import { useMemo } from "react";
import { useAppState } from "../lib/AppContext";
import { statusFor } from "../lib/store";
import { CredStatus } from "../lib/types";

const STATUS_DOT: Record<CredStatus, string> = {
  expired: "bg-red-500",
  urgent: "bg-amber-500",
  upcoming: "bg-blue-500",
  valid: "bg-emerald-500"
};

const MONTH_LABEL = new Intl.DateTimeFormat(undefined, { month: "short" });

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// A simple horizontal timeline: overdue certs first, then one column per
// upcoming month (through the furthest-out expiry currently tracked, capped
// at 12 months out so a single far-future cert doesn't stretch the view).
export default function RenewalTimeline() {
  const { state } = useAppState();
  const { certificates } = state;

  const columns = useMemo(() => {
    if (certificates.length === 0) return [];

    const now = new Date();
    const overdue = certificates.filter((c) => statusFor(c.expiryDate) === "expired");
    const upcoming = certificates.filter((c) => statusFor(c.expiryDate) !== "expired");

    const byMonth = new Map<string, typeof certificates>();
    for (const c of upcoming) {
      const d = new Date(c.expiryDate);
      const capped = new Date(now.getFullYear(), now.getMonth() + 12, 1);
      if (d > capped) continue;
      const key = monthKey(d);
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(c);
    }

    const monthCols = Array.from(byMonth.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, certs]) => {
        const [y, m] = key.split("-").map(Number);
        const d = new Date(y, m - 1, 1);
        return {
          key,
          label: `${MONTH_LABEL.format(d)} ${y !== now.getFullYear() ? String(y).slice(2) : ""}`.trim(),
          certs: certs.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
        };
      });

    const overdueCol = overdue.length > 0 ? [{ key: "overdue", label: "Overdue", certs: overdue }] : [];

    return [...overdueCol, ...monthCols];
  }, [certificates]);

  if (columns.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="text-caption font-medium text-ink-faint uppercase tracking-wide mb-2">
        Renewal timeline
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-0.5 px-0.5">
        {columns.map((col) => (
          <div
            key={col.key}
            className={`flex-shrink-0 min-w-[140px] rounded-xl border px-3 py-2.5 ${
              col.key === "overdue"
                ? "border-red-500/20 bg-red-500/5"
                : "border-hairline dark:border-hairline/15 bg-panel"
            }`}
          >
            <div
              className={`text-xs font-medium mb-2 ${
                col.key === "overdue" ? "text-red-600 dark:text-red-400" : "text-ink-muted"
              }`}
            >
              {col.label}
            </div>
            <div className="space-y-1.5">
              {col.certs.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 text-xs text-ink truncate">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[statusFor(c.expiryDate)]}`} />
                  <span className="truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
