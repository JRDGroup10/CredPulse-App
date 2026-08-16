import { STATUS_STYLES, statusFor, daysUntil } from "../lib/store";

export default function StatusBadge({ expiryDate }: { expiryDate: string }) {
  const status = statusFor(expiryDate);
  const style = STATUS_STYLES[status];
  const days = daysUntil(expiryDate);

  const detail =
    status === "expired"
      ? `${Math.abs(days)}d overdue`
      : `${days}d left`;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${style.bg} ${style.text}`}>
      <span className="relative flex w-1.5 h-1.5">
        {(status === "urgent" || status === "expired") && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${style.dot} animate-pulse-ring`} />
        )}
        <span className={`relative inline-flex rounded-full w-1.5 h-1.5 ${style.dot}`} />
      </span>
      {style.label} · {detail}
    </span>
  );
}
