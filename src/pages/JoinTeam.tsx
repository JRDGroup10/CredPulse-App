import { useLocation } from "react-router-dom";
import { LogoMark } from "../components/Logo";

/**
 * Landing page for the link in a team-invite email (see the send-team-invite
 * Edge Function and inviteToOrganization in src/lib/store.ts). Purely a
 * friendly front door — it doesn't do the actual joining itself. Signing up
 * with the invited email auto-joins the team (handle_new_user() trigger);
 * logging in with an existing account surfaces the accept banner on the
 * Dashboard (TeamInviteBanner.tsx). This page just explains that and hands
 * off to Auth.
 */
export default function JoinTeam({
  onGetStarted,
  onLogin
}: {
  onGetStarted: (orgName: string) => void;
  onLogin: () => void;
}) {
  const { search } = useLocation();
  const orgName = new URLSearchParams(search).get("org") || "your team";

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-sm w-full text-center animate-fade-in-up">
        <LogoMark className="w-14 h-14 mx-auto mb-4 drop-shadow-md" />
        <h1 className="text-xl font-semibold text-slate-900 mb-2">
          You've been invited to join <span className="text-gradient">{orgName}</span>
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          {orgName} uses CredPulse to track certification compliance across the team. Create an
          account (or log in, if you already have one) using the email address your invite was sent
          to, and you'll be added automatically.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => onGetStarted(orgName)}
            className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-medium py-2.5 rounded-lg text-sm shadow-glow transition-all hover:-translate-y-0.5"
          >
            Create your account
          </button>
          <button
            onClick={onLogin}
            className="w-full text-sm font-medium text-slate-600 hover:text-slate-900 py-2 transition-colors"
          >
            I already have an account — log in
          </button>
        </div>
      </div>
    </div>
  );
}
