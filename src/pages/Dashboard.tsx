import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import { canUseTipsAndLinks, certLimit, daysUntil, removeCertificate, statusFor } from "../lib/store";
import { PLANS } from "../lib/plans";
import { CertScope, CredStatus } from "../lib/types";
import CertCard from "../components/CertCard";
import CountUp from "../components/CountUp";
import ProgressRing from "../components/ProgressRing";
import RoleChecklistCard from "../components/RoleChecklistCard";
import InviteTeamPrompt from "../components/InviteTeamPrompt";

const ORDER: Record<string, number> = { expired: 0, urgent: 1, upcoming: 2, valid: 3 };

type StatusFilter = "all" | CredStatus;
type ScopeFilter = "all" | CertScope;
type SortMode = "expiry-soonest" | "expiry-furthest" | "name";

export default function Dashboard() {
  const { state, refresh } = useAppState();
  const isOrgMember = !!state.profile.organizationId;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("expiry-soonest");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const filtered = state.certificates.filter((c) => {
    if (statusFilter !== "all" && statusFor(c.expiryDate) !== statusFilter) return false;
    if (scopeFilter !== "all" && c.scope !== scopeFilter) return false;
    return true;
  });

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      const byStatus = ORDER[statusFor(a.expiryDate)] - ORDER[statusFor(b.expiryDate)];
      if (sortMode === "expiry-furthest") {
        return daysUntil(b.expiryDate) - daysUntil(a.expiryDate);
      }
      if (byStatus !== 0) return byStatus;
      return daysUntil(a.expiryDate) - daysUntil(b.expiryDate);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sortMode]);

  const filtersActive = statusFilter !== "all" || scopeFilter !== "all";

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitBulkMode() {
    setBulkMode(false);
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    const ok = window.confirm(
      `Remove ${selectedIds.size} certificate${selectedIds.size === 1 ? "" : "s"}? This can't be undone.`
    );
    if (!ok) return;
    setBulkDeleting(true);
    try {
      const targets = state.certificates.filter((c) => selectedIds.has(c.id));
      await Promise.all(targets.map((c) => removeCertificate(c.id, c.filePath)));
      await refresh();
      exitBulkMode();
    } finally {
      setBulkDeleting(false);
    }
  }

  const total = state.certificates.length;
  const expiredCount = state.certificates.filter((c) => statusFor(c.expiryDate) === "expired").length;
  const urgentCount = state.certificates.filter((c) => statusFor(c.expiryDate) === "urgent").length;
  const validCount = state.certificates.filter((c) => statusFor(c.expiryDate) === "valid" || statusFor(c.expiryDate) === "upcoming").length;
  const limit = certLimit(state);
  const isUnlimited = !Number.isFinite(limit);
  const plan = PLANS[state.profile.plan];
  // The plan-usage bar only ever tracks 'personal' certs for a team member —
  // clinic-scoped ones are unlimited and shouldn't count against it. For
  // anyone with no organization, that's just all of their certificates.
  const relevantCount = isOrgMember ? state.certificates.filter((c) => c.scope === "personal").length : total;
  const usagePct = isUnlimited ? 0 : Math.min(100, (relevantCount / limit) * 100);
  const healthPct = total === 0 ? 0 : Math.round((validCount / total) * 100);

  const upcoming = sorted.filter((c) => statusFor(c.expiryDate) !== "valid").slice(0, 3);

  async function handleRemove(id: string) {
    const cert = state.certificates.find((c) => c.id === id);
    await removeCertificate(id, cert?.filePath);
    await refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Hi {state.profile.name.split(" ")[0]} — here's where you stand
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{state.profile.role}</p>
        </div>
        <Link
          to="/add"
          className="bg-gradient-to-br from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white text-sm font-medium px-3.5 py-2 rounded-lg shadow-glow transition-all hover:-translate-y-0.5"
        >
          + Add certificate
        </Link>
      </div>

      <RoleChecklistCard />
      <InviteTeamPrompt />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card hover:-translate-y-0.5 transition-transform">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
            <CountUp value={total} />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total tracked</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card hover:-translate-y-0.5 transition-transform">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
            <CountUp value={expiredCount} />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Expired</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card hover:-translate-y-0.5 transition-transform">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            <CountUp value={urgentCount} />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Due within 2 weeks</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
          <div className="relative flex-shrink-0">
            <ProgressRing pct={healthPct} color="#10b981" size={44} stroke={5} />
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              {healthPct}%
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">In good standing</div>
        </div>
      </div>

      {!isUnlimited && (
        <div className="mb-5 flex items-center gap-3 bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-lg px-3 py-2.5">
          <div className="relative flex-shrink-0">
            <ProgressRing
              pct={usagePct}
              // ProgressRing draws via inline SVG attributes, which don't
              // resolve the app's CSS-variable color tokens (see
              // index.css) — so this one spot needs an explicit hex per
              // industry rather than a Tailwind class. Matches brand-600's
              // amber value for other-industries accounts.
              color={usagePct >= 100 ? "#ef4444" : state.profile.industry === "other" ? "#d97706" : "#2563eb"}
              size={28}
              stroke={4}
            />
          </div>
          <div className="flex-1 text-xs text-slate-500 dark:text-slate-400">
            {relevantCount} of {limit} {isOrgMember ? "personal " : ""}certificates used on the {plan.name} plan
          </div>
          {relevantCount >= limit && (
            <Link to="/billing" className="text-xs font-semibold text-brand-600 dark:text-brand-400 whitespace-nowrap">
              Upgrade
            </Link>
          )}
        </div>
      )}

      {(expiredCount > 0 || urgentCount > 0) && (
        <div className="mb-5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          {expiredCount > 0 && (
            <div>
              <strong>{expiredCount}</strong> credential{expiredCount > 1 ? "s are" : " is"} already expired.
            </div>
          )}
          {urgentCount > 0 && (
            <div>
              <strong>{urgentCount}</strong> credential{urgentCount > 1 ? "s need" : " needs"} renewal within 2 weeks.
            </div>
          )}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Needs attention
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-0.5 px-0.5">
            {upcoming.map((c, i) => {
              const status = statusFor(c.expiryDate);
              const days = daysUntil(c.expiryDate);
              const tone =
                status === "expired"
                  ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300"
                  : status === "urgent"
                  ? "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300";
              return (
                <div
                  key={c.id}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className={`animate-fade-in-up flex-shrink-0 min-w-[180px] rounded-xl border px-3.5 py-3 ${tone}`}
                >
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-xs mt-1 opacity-80">
                    {status === "expired" ? `${Math.abs(days)}d overdue` : `${days}d left`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400">
          <p className="mb-3">No certifications tracked yet.</p>
          <Link to="/add" className="text-brand-600 dark:text-brand-400 font-medium">
            Add your first one
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="all">All statuses</option>
              <option value="expired">Expired</option>
              <option value="urgent">Renew now</option>
              <option value="upcoming">Upcoming</option>
              <option value="valid">Valid</option>
            </select>

            {isOrgMember && (
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value as ScopeFilter)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="all">Clinic &amp; personal</option>
                <option value="clinic">Clinic only</option>
                <option value="personal">Personal only</option>
              </select>
            )}

            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="expiry-soonest">Sort: expiring soonest</option>
              <option value="expiry-furthest">Sort: expiring furthest</option>
              <option value="name">Sort: name A–Z</option>
            </select>

            <button
              onClick={() => (bulkMode ? exitBulkMode() : setBulkMode(true))}
              className={`ml-auto text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                bulkMode
                  ? "border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              {bulkMode ? "Done selecting" : "Select multiple"}
            </button>
          </div>

          {bulkMode && (
            <div className="mb-4 flex items-center gap-3 bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-lg px-3 py-2.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex-1">
                {selectedIds.size === 0 ? "Select certificates to remove" : `${selectedIds.size} selected`}
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || bulkDeleting}
                className="text-xs font-semibold text-red-600 dark:text-red-400 disabled:opacity-40 hover:text-red-700 dark:hover:text-red-300"
              >
                {bulkDeleting ? "Removing…" : "Remove selected"}
              </button>
            </div>
          )}

          {sorted.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400">
              <p className="mb-2">No certificates match this filter.</p>
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setScopeFilter("all");
                }}
                className="text-brand-600 dark:text-brand-400 font-medium text-sm"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((cert, i) => (
                <div key={cert.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-fade-in-up">
                  <CertCard
                    cert={cert}
                    onRemove={handleRemove}
                    canUseTipsAndLinks={canUseTipsAndLinks(state, cert.scope)}
                    showScopeBadge={isOrgMember}
                    selectable={bulkMode}
                    selected={selectedIds.has(cert.id)}
                    onToggleSelect={toggleSelect}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
