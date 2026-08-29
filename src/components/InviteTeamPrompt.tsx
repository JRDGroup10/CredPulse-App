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
    <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-card flex items-center justify-between gap-4 animate-fade-in-up">
      <div>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Track your whole team from one place
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Invite coworkers to CredPulse and see everyone's certification status in a single dashboard.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          to="/settings"
          className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-glow transition-all whitespace-nowrap"
        >
          Invite your team
        </Link>
        <button
          onClick={handleDismiss}
          className="text-xs text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
