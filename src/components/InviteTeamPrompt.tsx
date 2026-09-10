import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../lib/AppContext";

const DISMISS_KEY = "credpulse-dismissed-invite-team-prompt";

/**
 * The team-invite viral loop: a lightweight, dismissible nudge shown to any
 * user who isn't on a team yet, pointing at the Create Team flow in
 * Settings. Every individual signup is a potential seed for a whole
 * clinic's worth of accounts — this is what turns that potential into
 * actual invites instead of relying on people to discover the feature
 * themselves. Dismissal persists across reloads (not just this session) so
 * it doesn't nag once someone's said no.
 */
export default function InviteTeamPrompt() {
  const { state } = useAppState();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  });

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  if (dismissed || state.profile.organizationId) return null;

  return (
    <div className="mb-6 card p-4 flex items-center justify-between gap-4 animate-fade-in-up">
      <div>
        <div className="text-caption font-medium text-ink">
          Track your whole team from one place
        </div>
        <p className="text-caption text-ink-muted mt-0.5">
          Invite coworkers to CredPulse and see everyone's certification status in a single dashboard.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link to="/settings" className="btn-primary text-[11px] px-3 py-1.5 whitespace-nowrap">
          Invite your team
        </Link>
        <button onClick={handleDismiss} className="text-caption text-ink-faint hover:text-ink">
          Dismiss
        </button>
      </div>
    </div>
  );
}
