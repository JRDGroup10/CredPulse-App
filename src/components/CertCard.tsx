import { Link } from "react-router-dom";
import { Certificate } from "../lib/types";
import { getCertificateFileUrl } from "../lib/store";
import StatusBadge from "./StatusBadge";

export default function CertCard({
  cert,
  onRemove,
  canUseTipsAndLinks = true,
  showScopeBadge = false,
  selectable = false,
  selected = false,
  onToggleSelect
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
}) {
  async function handleViewFile() {
    if (!cert.filePath) return;
    const url = await getCertificateFileUrl(cert.filePath);
    if (url) window.open(url, "_blank", "noopener");
  }
  return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4 shadow-card hover:shadow-glow hover:border-brand-200 dark:hover:border-brand-700 hover:-translate-y-0.5 transition-all duration-200">
      <div className="min-w-0 flex items-start gap-3">
        {selectable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(cert.id)}
            className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-400 flex-shrink-0 cursor-pointer"
            aria-label={`Select ${cert.name}`}
          />
        )}
        <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="font-medium text-slate-900 dark:text-slate-50 truncate">{cert.name}</div>
          {showScopeBadge && (
            <span
              className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                cert.scope === "clinic"
                  ? "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              {cert.scope === "clinic" ? "🏥 Clinic" : "Personal"}
            </span>
          )}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">{cert.issuer}</div>
        <div className="mt-2">
          <StatusBadge expiryDate={cert.expiryDate} />
        </div>
        {canUseTipsAndLinks ? (
          <>
            {cert.tip && (
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                <span>💡</span>
                <span>{cert.tip}</span>
              </div>
            )}
            {cert.renewalUrl && (
              <a
                href={cert.renewalUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-transform hover:translate-x-0.5"
              >
                Renew here →
              </a>
            )}
          </>
        ) : (
          (cert.tip || cert.renewalUrl) && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-brand-100 dark:border-brand-900 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1.5 text-xs text-brand-700 dark:text-brand-300">
              <span>🔒</span>
              <span className="flex-1">Renewal tip &amp; booking link available</span>
              <Link to="/billing" className="font-semibold whitespace-nowrap">
                Upgrade
              </Link>
            </div>
          )
        )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-xs text-slate-400 dark:text-slate-500">Expires</div>
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {new Date(cert.expiryDate).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })}
        </div>
        {cert.filePath && (
          <button onClick={handleViewFile} className="mt-2 block text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            View file
          </button>
        )}
        <button
          onClick={() => onRemove(cert.id)}
          className="mt-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
