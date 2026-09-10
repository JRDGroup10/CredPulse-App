import { promptInstall, useInstallState } from "../lib/installPrompt";

// Encourages installing CredPulse as an app (see lib/installPrompt.ts for
// the underlying beforeinstallprompt state machine). Rendered in
// Settings.tsx near ReferralCard. Renders nothing once already installed —
// there's nothing left to offer at that point.
export default function InstallAppCard() {
  const installState = useInstallState();

  if (installState === "installed") return null;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="font-medium text-ink">Install CredPulse</h2>
          <p className="text-caption text-ink-muted mt-0.5">
            Add it to your home screen for one-tap access and expiry push notifications.
          </p>
        </div>
        <span className="flex-shrink-0 text-2xl">📲</span>
      </div>

      {installState === "promptable" && (
        <button onClick={() => promptInstall()} className="btn-primary text-caption px-3 py-2">
          Install app
        </button>
      )}

      {installState === "ios-manual" && (
        <ol className="text-caption text-ink-muted list-decimal list-inside space-y-1">
          <li>
            Tap the Share icon <span aria-hidden="true">⬆️</span> in Safari's toolbar
          </li>
          <li>Scroll down and tap "Add to Home Screen"</li>
          <li>Tap "Add" in the top right</li>
        </ol>
      )}

      {installState === "unavailable" && (
        <p className="text-caption text-ink-faint">
          Your browser doesn't offer an install prompt right now — try again from your phone's browser, or check
          back later.
        </p>
      )}
    </div>
  );
}
