import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import {
  daysUntil,
  getOrganization,
  listOrgMemberCertificates,
  listOrgMembers,
  orgBillingIncomplete,
  statusFor
} from "../lib/store";
import { Certificate, Organization, OrgMember } from "../lib/types";

interface MemberWithCerts extends OrgMember {
  certificates: Certificate[];
}

// Deliberately separate from Team.tsx's STATUS_STYLES, which includes
// dark: variants — this report is meant to be printed/saved as a PDF and
// handed to someone outside the app, so it always renders in plain light
// colors regardless of whether the viewer currently has dark mode on
// (Tailwind's dark: classes key off the <html> element, which stays "dark"
// during printing too, so simply reusing STATUS_STYLES here would produce
// a dark, hard-to-read printout for anyone using dark mode).
const REPORT_STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  expired: { label: "Expired", bg: "bg-red-50", text: "text-red-700" },
  urgent: { label: "Renew now", bg: "bg-amber-50", text: "text-amber-700" },
  upcoming: { label: "Upcoming", bg: "bg-blue-50", text: "text-blue-700" },
  valid: { label: "Valid", bg: "bg-emerald-50", text: "text-emerald-700" },
  none: { label: "Not tracked", bg: "bg-slate-100", text: "text-slate-500" }
};

/**
 * Printable, dated compliance report for an admin/owner to hand to an
 * auditor or regulator — "who's covered, who's expired," one page per
 * clinic. Reuses the same admin-only data-fetching as Team.tsx (org +
 * members + their clinic-scoped certificates), but renders it as a plain,
 * always-light document instead of the interactive grouped-by-certificate
 * dashboard, and offers a "Print / Save as PDF" button that hands off to
 * the browser's native print-to-PDF rather than pulling in a PDF-generation
 * library. Layout.tsx's header/footer are hidden at print time via the
 * .no-print class (see index.css), so what prints is just this page.
 */
export default function ComplianceReport() {
  const { state } = useAppState();
  const { organizationId, orgRole, name, email } = state.profile;
  const isAdmin = orgRole === "owner" || orgRole === "admin";

  const [org, setOrg] = useState<Organization | null>(null);
  const [membersWithCerts, setMembersWithCerts] = useState<MemberWithCerts[] | null>(null);

  useEffect(() => {
    if (!organizationId || !isAdmin) return;
    let cancelled = false;
    (async () => {
      const [orgData, members] = await Promise.all([getOrganization(organizationId), listOrgMembers(organizationId)]);
      const withCerts = await Promise.all(
        members.map(async (m) => ({ ...m, certificates: await listOrgMemberCertificates(m.id) }))
      );
      if (!cancelled) {
        setOrg(orgData);
        setMembersWithCerts(withCerts.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email)));
      }
    })();
    return () => {
      cancelled = true;
    };
    // countOrgSeatsUsed isn't needed on the report itself; kept imported
    // only so this file's data-fetching stays easy to diff against Team.tsx.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, isAdmin]);

  const generatedAt = useMemo(
    () => new Date().toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }),
    []
  );

  if (!organizationId || !isAdmin) {
    return <Navigate to="/settings" replace />;
  }
  if (org && orgBillingIncomplete(org)) {
    return <Navigate to="/settings" replace />;
  }

  const allCerts = membersWithCerts?.flatMap((m) => m.certificates) ?? [];
  const expiredCount = allCerts.filter((c) => statusFor(c.expiryDate) === "expired").length;
  const urgentCount = allCerts.filter((c) => statusFor(c.expiryDate) === "urgent").length;
  const notTrackedCount = membersWithCerts?.filter((m) => m.certificates.length === 0).length ?? 0;
  const memberCount = membersWithCerts?.length ?? 0;

  return (
    <div>
      <div className="no-print flex items-center justify-between gap-3 mb-4">
        <Link to="/team" className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100">
          ← Back to Team
        </Link>
        <button
          onClick={() => window.print()}
          disabled={membersWithCerts === null}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Print / Save as PDF
        </button>
      </div>

      {membersWithCerts === null ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading report…</p>
      ) : (
        <div className="bg-white text-slate-900 border border-slate-200 rounded-xl shadow-card p-6 sm:p-8 print:border-0 print:shadow-none print:p-0">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Compliance Report</div>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">{org?.name ?? "Team"}</h1>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>Generated {generatedAt}</div>
              <div>By {name || email}</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-8">
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="text-lg font-bold text-slate-900 tabular-nums">{memberCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Team members</div>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="text-lg font-bold text-red-600 tabular-nums">{expiredCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Expired</div>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="text-lg font-bold text-amber-600 tabular-nums">{urgentCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Due within 2 weeks</div>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <div className="text-lg font-bold text-slate-500 tabular-nums">{notTrackedCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Not tracked</div>
            </div>
          </div>

          {memberCount === 0 ? (
            <p className="text-sm text-slate-500">No teammates yet — nothing to report.</p>
          ) : (
            <div className="space-y-6">
              {membersWithCerts!.map((m) => (
                <div key={m.id} className="break-inside-avoid">
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="font-semibold text-slate-800">{m.name || m.email}</span>
                    {m.role && <span className="text-xs text-slate-400">{m.role}</span>}
                  </div>
                  {m.certificates.length === 0 ? (
                    <p className="text-xs text-slate-400 italic pl-0.5">No certificate on file</p>
                  ) : (
                    <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-50 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                          <th className="px-3 py-1.5">Certification</th>
                          <th className="px-3 py-1.5">Expires</th>
                          <th className="px-3 py-1.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[...m.certificates]
                          .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate))
                          .map((c) => {
                            const status = statusFor(c.expiryDate);
                            const style = REPORT_STATUS_STYLES[status];
                            return (
                              <tr key={c.id}>
                                <td className="px-3 py-2 font-medium text-slate-700">{c.name}</td>
                                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                                  {new Date(c.expiryDate).toLocaleDateString()}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${style.bg} ${style.text}`}>
                                    {style.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-slate-200 text-[11px] text-slate-400">
            Generated by CredPulse (credpulse.app) · Reflects certification data on file as of the date above.
          </div>
        </div>
      )}
    </div>
  );
}
