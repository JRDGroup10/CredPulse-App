import { Link } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import { certLimit, daysUntil, removeCertificate, statusFor } from "../lib/store";
import { PLANS } from "../lib/plans";
import CertCard from "../components/CertCard";
import CountUp from "../components/CountUp";
import ProgressRing from "../components/ProgressRing";

const ORDER: Record<string, number> = { expired: 0, urgent: 1, upcoming: 2, valid: 3 };

export default function Dashboard() {
  const { state, refresh } = useAppState();

  const sorted = [...state.certificates].sort((a, b) => {
    const byStatus = ORDER[statusFor(a.expiryDate)] - ORDER[statusFor(b.expiryDate)];
    if (byStatus !== 0) return byStatus;
    return daysUntil(a.expiryDate) - daysUntil(b.expiryDate);
  });

  const total = state.certificates.length;
  const expiredCount = state.certificates.filter((c) => statusFor(c.expiryDate) === "expired").length;
  const urgentCount = state.certificates.filter((c) => statusFor(c.expiryDate) === "urgent").length;
  const validCount = state.certificates.filter((c) => statusFor(c.expiryDate) === "valid" || statusFor(c.expiryDate) === "upcoming").length;
  const limit = certLimit(state);
  const isUnlimited = !Number.isFinite(limit);
  const plan = PLANS[state.profile.plan];
  const usagePct = isUnlimited ? 0 : Math.min(100, (total / limit) * 100);
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
            <ProgressRing pct={usagePct} color={usagePct >= 100 ? "#ef4444" : "#2563eb"} size={28} stroke={4} />
          </div>
          <div className="flex-1 text-xs text-slate-500 dark:text-slate-400">
            {state.certificates.length} of {limit} certificates used on the {plan.name} plan
          </div>
          {state.certificates.length >= limit && (
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

      {sorted.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400">
          <p className="mb-3">No certifications tracked yet.</p>
          <Link to="/add" className="text-brand-600 dark:text-brand-400 font-medium">
            Add your first one
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((cert, i) => (
            <div key={cert.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-fade-in-up">
              <CertCard cert={cert} onRemove={handleRemove} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
