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
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="max-w-sm w-full text-center animate-fade-in-up">
        <LogoMark className="w-14 h-14 mx-auto mb-4" />
        <h1 className="text-subheading font-medium text-ink mb-2">
          You've been invited to join {orgName}
        </h1>
        <p className="text-body text-ink-muted mb-8">
          {orgName} uses CredPulse to track certification compliance across the team. Create an
          account (or log in, if you already have one) using the email address your invite was sent
          to, and you'll be added automatically.
        </p>
        <div className="space-y-3">
          <button onClick={() => onGetStarted(orgName)} className="btn-primary w-full text-body py-2.5">
            Create your account
          </button>
          <button onClick={onLogin} className="w-full text-body font-medium text-ink-muted hover:text-ink py-2 transition-colors">
            I already have an account — log in
          </button>
        </div>
      </div>
    </div>
  );
}
