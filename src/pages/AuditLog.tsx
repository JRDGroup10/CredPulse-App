import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import { AUDIT_ACTION_LABELS, getOrganization, listAuditLog, orgBillingIncomplete } from "../lib/store";
import { AuditAction, AuditLogEntry, Organization } from "../lib/types";

type ActionFilter = "all" | AuditAction;

/**
 * Read-only, admin/owner-only trail of who-did-what-when for this org —
 * certificate changes, team membership changes, and plan changes. See
 * supabase/organizations-schema.sql's audit_log table for the RLS that
 * enforces this same admin-only boundary server-side (this page's gating
 * is a UX nicety on top of that, not the real security boundary), and
 * store.ts's logAudit() for what actually writes these rows.
 *
 * Deliberately no export/delete controls here — an audit log that can be
 * edited or cleared from the UI isn't much of an audit log. If someone
 * needs these off-platform later, that's a "give me a CSV" feature to add
 * on top, not a reason to make entries mutable.
 */
export default function AuditLog() {
  const { state } = useAppState();
  const { organizationId, orgRole } = state.profile;
  const isAdmin = orgRole === "owner" || orgRole === "admin";

  const [org, setOrg] = useState<Organization | null>(null);
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId || !isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const [orgData, log] = await Promise.all([getOrganization(organizationId), listAuditLog(organizationId)]);
        if (!cancelled) {
          setOrg(orgData);
          setEntries(log);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load the audit log.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId, isAdmin]);

  const filtered = useMemo(() => {
    if (!entries) return null;
    if (actionFilter === "all") return entries;
    return entries.filter((e) => e.action === actionFilter);
  }, [entries, actionFilter]);

  // Only offer filters for actions that actually appear, rather than every
  // possible AuditAction — an empty dropdown option for something that's
  // never happened yet just adds noise.
  const actionsPresent = useMemo(() => {
    const set = new Set<AuditAction>();
    (entries ?? []).forEach((e) => set.add(e.action));
    return Array.from(set);
  }, [entries]);

  if (!organizationId || !isAdmin) {
    return <Navigate to="/settings" replace />;
  }
  if (org && orgBillingIncomplete(org)) {
    return <Navigate to="/settings" replace />;
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Audit log</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Who did what, and when — certificate changes, team membership, and plan changes for {org?.name ?? "your team"}.
          </p>
        </div>
        <Link
          to="/team"
          className="flex-shrink-0 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
        >
          ← Back to Team
        </Link>
      </div>

      {actionsPresent.length > 1 && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <label htmlFor="audit-action-filter" className="text-slate-500 dark:text-slate-400">
            Filter:
          </label>
          <select
            id="audit-action-filter"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as ActionFilter)}
            className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="all">All activity</option>
            {actionsPresent.map((a) => (
              <option key={a} value={a}>
                {AUDIT_ACTION_LABELS[a]}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {entries === null && !error ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
      ) : filtered && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {entries && entries.length > 0
              ? "Nothing matches that filter."
              : "Nothing logged yet — this fills in as certificates get added or removed, teammates get invited, and the plan changes."}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Who</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered!.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    {entry.actorName}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {AUDIT_ACTION_LABELS[entry.action]}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{entry.targetLabel ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
