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
  const { email, organizationId } = state.profile;

  const [invite, setInvite] = useState<OrgInviteWithOrgName | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [accepting, setAccepting] = useState(false);

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
    try {
      await acceptOrganizationInvite(userId, { id: invite.id, organizationId: invite.organizationId });
      await refresh();
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="bg-brand-600 text-white">
      <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <span>
          You've been invited to join <span className="font-semibold">{invite.organizationName}</span> on CredPulse.
        </span>
        <div className="flex items-center gap-3 whitespace-nowrap">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="font-semibold underline underline-offset-2 disabled:opacity-60"
          >
            {accepting ? "Joining…" : "Accept"}
          </button>
          <button onClick={() => setDismissed(true)} className="text-white/70 hover:text-white transition-colors">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
