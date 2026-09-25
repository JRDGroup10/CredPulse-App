import { useState } from "react";
import { useAppState } from "../lib/AppContext";
import { updateProfile, verificationLinkFor } from "../lib/store";

// Lets a user turn on a public, no-login page that shows their
// certifications and current status — a link an employer or credentialing
// body can be sent directly, without giving them a CredPulse account or
// database access. See VerifyPublic.tsx (what the link renders) and
// supabase/functions/public-verify (the only thing that ever reads this
// data server-side, and only when share_enabled is true).
export default function ShareVerificationLink() {
  const { userId, state, refresh } = useAppState();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const enabled = state.profile.shareEnabled;
  const link = verificationLinkFor(state.profile.shareToken);

  async function toggle() {
    setSaving(true);
    try {
      await updateProfile(userId, { shareEnabled: !enabled });
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be blocked (permissions, non-HTTPS, older
      // browsers) — the link is still shown as selectable text below, so
      // there's always a manual fallback even if this silently fails.
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="font-medium text-ink">Shareable verification link</h2>
          <p className="text-caption text-ink-muted mt-0.5">
            A public, read-only page an employer or credentialing body can check — no login required.
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={saving}
          role="switch"
          aria-checked={enabled}
          className={`flex-shrink-0 w-11 h-6 rounded-pill relative transition-colors disabled:opacity-50 ${
            enabled ? "bg-brand-500" : "bg-hairline dark:bg-hairline/20"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t border-hairline/70 dark:border-hairline/10">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(link)}`}
            alt="QR code for your verification link"
            width={120}
            height={120}
            className="rounded-ui border border-hairline dark:border-hairline/15 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="text-caption text-ink-faint mb-1">Your link</div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 text-caption text-ink-muted bg-panel border border-hairline dark:border-hairline/15 rounded-ui px-2.5 py-1.5 truncate"
              />
              <button
                onClick={copyLink}
                className="flex-shrink-0 text-caption font-medium text-brand-700 dark:text-brand-400 whitespace-nowrap"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-caption text-ink-faint mt-2">
              Shows your name, role, and each certification's name and status — never files, notes, or your email.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
