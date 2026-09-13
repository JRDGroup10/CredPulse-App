import { useEffect, useState } from "react";
import { useAppState } from "../lib/AppContext";
import { acceptOrganizationInvite, getPendingInvitesForEmail } from "../lib/store";
import { OrgInviteWithOrgName } from "../lib/types";

/**
 * Full-width banner shown to a signed-in user (not already on a team) who
 * has a pending team invite waiting for their email address. Lets them
 * accept it without leaving the app. Rendered in Layout.tsx so it's visible
 * from any page.
 */
export default function TeamInviteBanner() {
  const { userId, state, refresh } = useAppState();
  const { name, email, organizationId } = state.profile;

  const [invite, setInvite] = useState<OrgInviteWithOrgName | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) return; // already on a team — nothing to accept
    getPendingInvitesForEmail(email).then((invites) => {
      if (invites.length > 0) setInvite(invites[0]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, organizationId]);

  if (!invite || dismissed || organizationId) return null;

  async function handleAccept() {
    if (!invite) return;
    setAccepting(true);
    setError(null);
    try {
      await acceptOrganizationInvite(userId, { id: invite.id, organizationId: invite.organizationId }, { name, email });
      await refresh();
    } catch (err) {
      // As of CRE-11, acceptOrganizationInvite can now legitimately throw
      // (the org hit its seat limit between invite and accept) — this used
      // to be an unhandled rejection since nothing here ever caught an
      // error before.
      setError(err instanceof Error ? err.message : "Couldn't accept that invite — try again.");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="bg-brand-500/10 border-b border-brand-500/20 text-brand-700 dark:text-brand-400">
      <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-body flex-wrap">
        <span>
          You've been invited to join <span className="font-medium">{invite.organizationName}</span> on CredPulse.
        </span>
        <div className="flex items-center gap-3 whitespace-nowrap">
          <button onClick={handleAccept} disabled={accepting} className="font-medium underline underline-offset-2 disabled:opacity-60">
            {accepting ? "Joining…" : "Accept"}
          </button>
          <button onClick={() => setDismissed(true)} className="text-ink-faint hover:text-ink-muted transition-colors">
            Dismiss
          </button>
        </div>
      </div>
      {error && (
        <div className="max-w-3xl mx-auto px-4 pb-2.5 text-caption text-red-600 dark:text-red-400">{error}</div>
      )}
    </div>
  );
}
