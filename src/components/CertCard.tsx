import { Certificate } from "../lib/types";
import { getCertificateFileUrl } from "../lib/store";
import StatusBadge from "./StatusBadge";

export default function CertCard({
  cert,
  onRemove
}: {
  cert: Certificate;
  onRemove: (id: string) => void;
}) {
  async function handleViewFile() {
    if (!cert.filePath) return;
    const url = await getCertificateFileUrl(cert.filePath);
    if (url) window.open(url, "_blank", "noopener");
  }
  return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4 shadow-card hover:shadow-glow hover:border-brand-200 dark:hover:border-brand-700 hover:-translate-y-0.5 transition-all duration-200">
      <div className="min-w-0">
        <div className="font-medium text-slate-900 dark:text-slate-50 truncate">{cert.name}</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">{cert.issuer}</div>
        <div className="mt-2">
          <StatusBadge expiryDate={cert.expiryDate} />
        </div>
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
