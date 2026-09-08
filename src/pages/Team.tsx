import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import {
  IndustryBenchmark,
  STATUS_STYLES,
  clearCertificateVerification,
  countOrgSeatsUsed,
  daysUntil,
  getIndustryBenchmark,
  getOrganization,
  listOrgMemberCertificates,
  listOrgMembers,
  orgBillingIncomplete,
  statusFor,
  verifyCertificate
} from "../lib/store";
import { ORG_PLANS, nextOrgPlanAbove } from "../lib/orgPlans";
import { getVerificationLink } from "../lib/verificationProviders";
import { getOnboardingProgress } from "../lib/onboardingChecklist";
import { Certificate, CredStatus, Organization, OrgMember } from "../lib/types";
import CountUp from "../components/CountUp";

interface MemberWithCerts extends OrgMember {
  certificates: Certificate[];
}

type GroupStatus = CredStatus | "none";

/** One row per person holding a given certificate. expiryDate/status are
 * only meaningful for real certificate groups — the synthetic "not tracked"
 * group (people with zero certificates) leaves them null/"none". */
interface CertHolder {
  certId: string;
  memberId: string;
  memberName: string;
  memberRole: string;
  expiryDate: string | null;
  status: GroupStatus;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

interface CertGroup {
  key: string;
  certName: string;
  holders: CertHolder[]; // sorted most urgent (most overdue, then soonest) first
  worst: GroupStatus;
}

const GROUP_ORDER: Record<GroupStatus, number> = { expired: 0, urgent: 1, none: 2, upcoming: 3, valid: 4 };
const NOT_TRACKED_KEY = "__not_tracked__";

const NOT_TRACKED_STYLE = {
  label: "Needs onboarding",
  bg: "bg-slate-100 dark:bg-slate-800",
  text: "text-slate-500 dark:text-slate-400"
};

/**
 * Manager/owner-only compliance roll-up, grouped by certificate (like a
 * spreadsheet grouped by column) rather than by person — a clinic manager
 * usually thinks "who's covered for CPR" before "what does Jane have."
 * Each certificate is a collapsible section; inside, holders are sorted by
 * expiry urgency (most overdue/soonest first). People with zero
 * certificates get their own "not tracked" group so they're never silently
 * missing from the view. Gated to org owners/admins — everyone else
 * bounces to Settings (the nav link is hidden for them too, see Layout.tsx).
 */
export default function Team() {
  const { state, userId } = useAppState();
  const { organizationId, orgRole } = state.profile;
  const isAdmin = orgRole === "owner" || orgRole === "admin";

  const [org, setOrg] = useState<Organization | null>(null);
  const [membersWithCerts, setMembersWithCerts] = useState<MemberWithCerts[] | null>(null);
  const [seatsUsed, setSeatsUsed] = useState(0);
  // undefined = still loading, null = no benchmark to show (not enough
  // contributing clinics — see getIndustryBenchmark), object = show it.
  const [benchmark, setBenchmark] = useState<IndustryBenchmark | null | undefined>(undefined);

  useEffect(() => {
    if (!organizationId || !isAdmin) return;
    let cancelled = false;
    (async () => {
      const [orgData, members, seats] = await Promise.all([
        getOrganization(organizationId),
        listOrgMembers(organizationId),
        countOrgSeatsUsed(organizationId)
      ]);
      const withCerts = await Promise.all(
        members.map(async (m) => ({ ...m, certificates: await listOrgMemberCertificates(m.id) }))
      );
      const industryBenchmark = orgData ? await getIndustryBenchmark(orgData.industry) : null;
      if (!cancelled) {
        setOrg(orgData);
        setMembersWithCerts(withCerts);
        setSeatsUsed(seats);
        setBenchmark(industryBenchmark);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId, isAdmin]);

  const groups = useMemo<CertGroup[]>(() => {
    if (!membersWithCerts) return [];

    const byCert = new Map<string, CertHolder[]>();
    const notTracked: CertHolder[] = [];

    for (const m of membersWithCerts) {
      const memberName = m.name || m.email;
      if (m.certificates.length === 0) {
        notTracked.push({
          certId: "",
          memberId: m.id,
          memberName,
          memberRole: m.role,
          expiryDate: null,
          status: "none",
          verifiedAt: null,
          verifiedBy: null
        });
        continue;
      }
      for (const c of m.certificates) {
        const holder: CertHolder = {
          certId: c.id,
          memberId: m.id,
          memberName,
          memberRole: m.role,
          expiryDate: c.expiryDate,
          status: statusFor(c.expiryDate),
          verifiedAt: c.verifiedAt ?? null,
          verifiedBy: c.verifiedBy ?? null
        };
        const list = byCert.get(c.name) ?? [];
        list.push(holder);
        byCert.set(c.name, list);
      }
    }

    const certGroups: CertGroup[] = Array.from(byCert.entries()).map(([certName, holders]) => {
      const sortedHolders = [...holders].sort((a, b) => daysUntil(a.expiryDate!) - daysUntil(b.expiryDate!));
      let worst: GroupStatus = "valid";
      for (const h of sortedHolders) {
        if (GROUP_ORDER[h.status] < GROUP_ORDER[worst]) worst = h.status;
      }
      return { key: certName, certName, holders: sortedHolders, worst };
    });

    if (notTracked.length > 0) {
      certGroups.push({
        key: NOT_TRACKED_KEY,
        certName: "No certificate on file",
        holders: notTracked.sort((a, b) => a.memberName.localeCompare(b.memberName)),
        worst: "none"
      });
    }

    return certGroups.sort((a, b) => {
      const byUrgency = GROUP_ORDER[a.worst] - GROUP_ORDER[b.worst];
      if (byUrgency !== 0) return byUrgency;
      return a.certName.localeCompare(b.certName);
    });
  }, [membersWithCerts]);

  // New-hire onboarding kit: which role-recommended certifications (see
  // roleChecklist.ts) is each member still missing? Necessarily runs only
  // against clinic-scoped certs (listOrgMemberCertificates()'s contract —
  // a member's personal certs stay private from the org admin, same
  // boundary as everywhere else in this dashboard), so someone who already
  // has a role-recommended cert tracked as "personal" will still show up
  // here as missing it from the clinic's point of view. Not limited to
  // brand-new hires by design — a role change surfaces the same way, and it
  // clears itself the moment the gap is actually closed, so there's no
  // separate "onboarding complete" state to track or expire.
  const onboardingGaps = useMemo(() => {
    if (!membersWithCerts) return [];
    return membersWithCerts
      .map((m) => {
        const progress = getOnboardingProgress(m.role, m.region, m.certificates);
        return { memberId: m.id, memberName: m.name || m.email, memberRole: m.role, missing: progress.missing };
      })
      .filter((g) => g.missing.length > 0)
      .sort((a, b) => b.missing.length - a.missing.length);
  }, [membersWithCerts]);

  // Resolves a verifying admin's profile id to a display name for the
  // "Verified by X" badge — every admin is also a member, so this list
  // already loaded for the page always has the name we need without a
  // separate lookup.
  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of membersWithCerts ?? []) map.set(m.id, m.name || m.email);
    return map;
  }, [membersWithCerts]);

  function applyVerification(memberId: string, certId: string, verifiedAt: string | null, verifiedBy: string | null) {
    setMembersWithCerts(
      (prev) =>
        prev?.map((m) =>
          m.id !== memberId
            ? m
            : { ...m, certificates: m.certificates.map((c) => (c.id === certId ? { ...c, verifiedAt, verifiedBy } : c)) }
        ) ?? prev
    );
  }

  async function handleVerify(h: CertHolder, certName: string) {
    if (!organizationId) return;
    const actor = { id: userId, name: state.profile.name, email: state.profile.email, organizationId };
    await verifyCertificate(h.certId, certName, actor);
    applyVerification(h.memberId, h.certId, new Date().toISOString(), userId);
  }

  async function handleClearVerification(h: CertHolder, certName: string) {
    if (!organizationId) return;
    const actor = { id: userId, name: state.profile.name, email: state.profile.email, organizationId };
    await clearCertificateVerification(h.certId, certName, actor);
    applyVerification(h.memberId, h.certId, null, null);
  }

  if (!organizationId || !isAdmin) {
    return <Navigate to="/settings" replace />;
  }

  // Billing was never completed (abandoned Stripe Checkout, or it failed) —
  // send them to Settings, which shows the "finish setting up billing"
  // prompt instead of this dashboard. Without this, an org could use the
  // full compliance dashboard indefinitely with no card ever on file.
  if (org && orgBillingIncomplete(org)) {
    return <Navigate to="/settings" replace />;
  }

  const allCerts = membersWithCerts?.flatMap((m) => m.certificates) ?? [];
  const expiredCount = allCerts.filter((c) => statusFor(c.expiryDate) === "expired").length;
  const urgentCount = allCerts.filter((c) => statusFor(c.expiryDate) === "urgent").length;
  const notTrackedCount = membersWithCerts?.filter((m) => m.certificates.length === 0).length ?? 0;
  const memberCount = membersWithCerts?.length ?? 0;
  const ownCompliancePct =
    allCerts.length > 0 ? Math.round(((allCerts.length - expiredCount) / allCerts.length) * 100) : null;

  const seatLimit = org ? ORG_PLANS[org.plan].seatLimit : 0;
  const seatLimitReached = org !== null && seatsUsed >= seatLimit;
  const upgradeSuggestion = seatLimit ? nextOrgPlanAbove(seatLimit) : null;
  const trialDaysLeft =
    org?.subscriptionStatus === "trialing" && org.trialEndsAt
      ? Math.max(0, Math.ceil((new Date(org.trialEndsAt).getTime() - Date.now()) / 86400000))
      : null;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{org?.name ?? "Team"} compliance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Grouped by certificate — expand one to see who holds it, soonest to expire first.
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <Link
            to="/team/api-keys"
            className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            API keys
          </Link>
          <Link
            to="/team/audit-log"
            className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            Audit log
          </Link>
          <Link
            to="/team/report"
            className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            Export report
          </Link>
        </div>
      </div>

      {org && memberCount <= 1 && (
        <div className="mb-6 rounded-xl border border-brand-100 dark:border-brand-900 bg-brand-50 dark:bg-brand-500/10 p-4 animate-fade-in-up">
          <div className="text-sm font-semibold text-brand-800 dark:text-brand-300">Welcome to {org.name} 👋</div>
          <p className="text-xs text-brand-700/80 dark:text-brand-300/80 mt-0.5">
            You're set up on the {ORG_PLANS[org.plan].name} plan (up to {seatLimit} team members). Next step:
            invite your coworkers — certs they mark "For my clinic" are unlimited and show up here
            automatically.
          </p>
          <Link
            to="/settings"
            className="inline-block mt-2 text-xs font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-900 dark:hover:text-brand-100"
          >
            Invite your team →
          </Link>
        </div>
      )}

      {trialDaysLeft !== null && (
        <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 px-4 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-3 shadow-card">
          <span>
            {trialDaysLeft === 0
              ? "Your free trial ends today."
              : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your free trial.`}
          </span>
          <span className="text-slate-400 dark:text-slate-500">
            {ORG_PLANS[org!.plan].name} plan · ${org!.billingCycle === "yearly" ? ORG_PLANS[org!.plan].priceYearly : ORG_PLANS[org!.plan].priceMonthly}/
            {org!.billingCycle === "yearly" ? "yr" : "mo"} after trial
          </span>
        </div>
      )}

      {seatLimitReached && (
        <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          You've used all {seatLimit} seats on the {org ? ORG_PLANS[org.plan].name : ""} plan.
          {upgradeSuggestion ? (
            <>
              {" "}
              <Link to="/settings" className="font-semibold underline">
                Upgrade to {ORG_PLANS[upgradeSuggestion].name}
              </Link>{" "}
              to invite more teammates.
            </>
          ) : (
            " You're on the largest plan — contact us if you need more seats."
          )}
        </div>
      )}

      {membersWithCerts === null ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading team…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                <CountUp value={memberCount} />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Team members</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                <CountUp value={expiredCount} />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Expired</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                <CountUp value={urgentCount} />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Due within 2 weeks</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-card">
              <div className="text-2xl font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                <CountUp value={notTrackedCount} />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Not tracked yet</div>
            </div>
          </div>

          {onboardingGaps.length > 0 && (
            <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-card p-4">
              <div className="mb-3">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Onboarding &amp; role coverage</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Based on each person's role, here's what's still missing — new hires and role changes both
                  show up here until it's resolved.
                </p>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {onboardingGaps.map((g) => (
                  <li key={g.memberId} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-shrink-0">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{g.memberName}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">{g.memberRole || "—"}</div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {g.missing.map((item) => (
                        <span
                          key={item.name}
                          className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 whitespace-nowrap"
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {benchmark && ownCompliancePct !== null && (
            <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">How you compare</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {ownCompliancePct >= Math.round(benchmark.avgCompliancePct)
                      ? "You're ahead of similar clinics — nice work staying on top of renewals."
                      : "A few renewals behind similar clinics — the list below shows exactly what's due."}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-center">
                  <div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-50 tabular-nums">{ownCompliancePct}%</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">Your clinic</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                  <div>
                    <div className="text-lg font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                      {Math.round(benchmark.avgCompliancePct)}%
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">Typical clinic</div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
                % of clinic-tracked certificates currently up to date, averaged anonymously across{" "}
                {benchmark.clinicCount} clinics in your industry on CredPulse. No other clinic's individual
                data is ever shown.
              </p>
            </div>
          )}

          {memberCount === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400">
              <p className="mb-3">No teammates yet.</p>
              <Link to="/settings" className="text-brand-600 dark:text-brand-400 font-medium">
                Invite your first coworker
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {groups.map((g) => {
                const style = g.worst === "none" ? NOT_TRACKED_STYLE : STATUS_STYLES[g.worst];
                const defaultOpen = g.worst === "expired" || g.worst === "urgent" || g.worst === "none";
                const isNotTracked = g.key === NOT_TRACKED_KEY;
                return (
                  <details key={g.key} open={defaultOpen}>
                    <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="font-medium text-slate-800 dark:text-slate-100 truncate">{g.certName}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {g.holders.length} {g.holders.length === 1 ? "person" : "people"}
                        </span>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </summary>
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 overflow-x-auto">
                      <table className="w-full text-sm min-w-[480px]">
                        <thead>
                          <tr className="text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                            <th className="px-4 pl-9 py-2">Name</th>
                            <th className="px-4 py-2">Role</th>
                            {!isNotTracked && <th className="px-4 py-2">Expires</th>}
                            {!isNotTracked && <th className="px-4 py-2">Status</th>}
                            {!isNotTracked && <th className="px-4 py-2 text-right">Verification</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {g.holders.map((h) => {
                            const hStyle = h.status === "none" ? NOT_TRACKED_STYLE : STATUS_STYLES[h.status];
                            const days = h.expiryDate ? daysUntil(h.expiryDate) : null;
                            const verificationLink = isNotTracked ? null : getVerificationLink(g.certName);
                            return (
                              <tr key={h.memberId} className="hover:bg-white dark:hover:bg-slate-900 transition-colors">
                                <td className="px-4 pl-9 py-2.5 font-medium text-slate-700 dark:text-slate-200">{h.memberName}</td>
                                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{h.memberRole || "—"}</td>
                                {!isNotTracked && (
                                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                    {h.status === "expired" ? `${Math.abs(days!)}d overdue` : `${days}d left`}
                                  </td>
                                )}
                                {!isNotTracked && (
                                  <td className="px-4 py-2.5">
                                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${hStyle.bg} ${hStyle.text}`}>
                                      {hStyle.label}
                                    </span>
                                  </td>
                                )}
                                {!isNotTracked && (
                                  <td className="px-4 py-2.5 text-right">
                                    {h.verifiedAt ? (
                                      <div className="flex items-center justify-end gap-2">
                                        <span
                                          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap"
                                          title={`Verified by ${memberNameById.get(h.verifiedBy ?? "") ?? "a team admin"} on ${new Date(h.verifiedAt).toLocaleDateString()}`}
                                        >
                                          ✓ Verified
                                        </span>
                                        <button
                                          onClick={() => handleClearVerification(h, g.certName)}
                                          className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 whitespace-nowrap"
                                        >
                                          Undo
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-end gap-2">
                                        {verificationLink && (
                                          <a
                                            href={verificationLink.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 whitespace-nowrap"
                                          >
                                            {verificationLink.isOfficial ? "Check registry ↗" : "Search ↗"}
                                          </a>
                                        )}
                                        <button
                                          onClick={() => handleVerify(h, g.certName)}
                                          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 whitespace-nowrap"
                                        >
                                          Mark verified
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
