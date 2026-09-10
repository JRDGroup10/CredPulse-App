import { Link } from "react-router-dom";
import { Certificate } from "../lib/types";
import { getCertificateFileUrl } from "../lib/store";
import { buildCertificateICS, downloadICS } from "../lib/ics";
import { buildRenewalSearchUrl } from "../lib/renewalSearch";
import StatusBadge from "./StatusBadge";
import CeuTracker from "./CeuTracker";

export default function CertCard({
  cert,
  onRemove,
  canUseTipsAndLinks = true,
  showScopeBadge = false,
  selectable = false,
  selected = false,
  onToggleSelect,
  reminderDays = [30, 7]
}: {
  cert: Certificate;
  onRemove: (id: string) => void;
  /** Free plan: we still save the AI-extracted tip/renewal link (see
   * AddCertificate.tsx), but show a locked teaser here instead of the real
   * content — a standing upgrade nudge instead of a one-time one. */
  canUseTipsAndLinks?: boolean;
  /** Only shown for users who belong to a team — lets them see at a glance
   * which of their certs are clinic-covered (visible to their admin) vs.
   * personal (private, counts against their own plan). Individual users
   * with no organization never see this, since it'd be meaningless noise. */
  showScopeBadge?: boolean;
  /** Bulk-actions mode on the Dashboard — shows a checkbox instead of
   * requiring one-at-a-time removal. */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  /** Same days-before-expiry the account's email/push reminders use (see
   * profile.reminderDays) — reused here so the downloaded calendar event's
   * alarms match what the person already expects, instead of inventing a
   * second, different reminder schedule. */
  reminderDays?: number[];
}) {
  async function handleViewFile() {
    if (!cert.filePath) return;
    const url = await getCertificateFileUrl(cert.filePath);
    if (url) window.open(url, "_blank", "noopener");
  }

  function handleAddToCalendar() {
    const ics = buildCertificateICS(cert, reminderDays);
    const safeName = cert.name.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "certificate";
    downloadICS(`${safeName}-renewal.ics`, ics);
  }
  return (
    <div className="group card p-4 flex items-start justify-between gap-4 hover:border-brand-500/30 hover:-translate-y-0.5 transition-all duration-200">
      <div className="min-w-0 flex items-start gap-3">
        {selectable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(cert.id)}
            className="mt-1 w-4 h-4 rounded border-hairline dark:border-hairline/20 text-brand-600 focus:ring-brand-500/40 flex-shrink-0 cursor-pointer"
            aria-label={`Select ${cert.name}`}
          />
        )}
        <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="font-medium text-ink truncate">{cert.name}</div>
          {showScopeBadge && (
            <span
              className={`badge-pill flex-shrink-0 text-[10px] whitespace-nowrap ${
                cert.scope === "clinic"
                  ? "bg-brand-500/10 text-brand-600 dark:text-brand-300"
                  : "bg-ink/5 text-ink-faint"
              }`}
            >
              {cert.scope === "clinic" ? "🏥 Clinic" : "Personal"}
            </span>
          )}
        </div>
        <div className="text-caption text-ink-muted">{cert.issuer}</div>
        <div className="mt-2">
          <StatusBadge expiryDate={cert.expiryDate} />
        </div>
        {canUseTipsAndLinks ? (
          <>
            {cert.tip && (
              <div className="mt-2 text-caption text-ink-muted flex items-start gap-1.5">
                <span>💡</span>
                <span>{cert.tip}</span>
              </div>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {cert.renewalUrl && (
                <a
                  href={cert.renewalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-caption font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-transform hover:translate-x-0.5"
                >
                  Renew here →
                </a>
              )}
              {/* Always shown, even when we don't have (or trust) a specific
                  official link — a plain search query is zero-risk since it
                  never hardcodes an organization's URL that could go stale
                  or be wrong for this user's exact situation. */}
              <a
                href={buildRenewalSearchUrl(cert.name)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-caption font-medium text-ink-faint hover:text-ink"
              >
                🔍 Find courses near me
              </a>
            </div>
          </>
        ) : (
          (cert.tip || cert.renewalUrl) && (
            <div className="mt-2 flex items-center gap-2 rounded-ui border border-brand-500/20 bg-brand-500/10 px-2.5 py-1.5 text-caption text-brand-600 dark:text-brand-300">
              <span>🔒</span>
              <span className="flex-1">Renewal tip &amp; booking link available</span>
              <Link to="/billing" className="font-medium whitespace-nowrap">
                Upgrade
              </Link>
            </div>
          )
        )}
        {cert.ceuRequired != null && <CeuTracker certificateId={cert.id} ceuRequired={cert.ceuRequired} />}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-caption text-ink-faint">Expires</div>
        <div className="text-caption font-medium text-ink">
          {/* expiryDate is a bare "YYYY-MM-DD" string, which Date parses as
              UTC midnight — without timeZone: "UTC" here, toLocaleDateString
              renders it in the viewer's local zone, showing the day before
              for anyone west of UTC (i.e. basically every real user). See
              daysUntil()'s comment in store.ts for the same bug class. */}
          {new Date(cert.expiryDate).toLocaleDateString("en-CA", {
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "UTC"
          })}
        </div>
        <button onClick={handleAddToCalendar} className="mt-2 block text-caption font-medium text-ink-faint hover:text-ink">
          Add to calendar
        </button>
        {cert.filePath && (
          <button onClick={handleViewFile} className="mt-1 block text-caption font-medium text-ink-faint hover:text-ink">
            View file
          </button>
        )}
        <button
          onClick={() => onRemove(cert.id)}
          className="mt-1 text-caption text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
