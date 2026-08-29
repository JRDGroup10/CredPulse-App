import { useEffect } from "react";
import { useAppState } from "../lib/AppContext";
import { createOrganization, startOrgCheckout } from "../lib/store";
import { clearPendingClinicSetup, readPendingClinicSetup } from "../lib/pendingClinicSetup";

/**
 * Mounted once inside the authenticated app (see App.tsx). If a clinic admin
 * signed up but their project required email confirmation, ClinicSignup.tsx
 * couldn't create the org yet (no session = no auth.uid() for RLS) and
 * instead stashed their chosen name/plan in localStorage. The moment this
 * user is signed in with no organizationId, finish the job automatically —
 * so confirming their email and logging in is the only extra step, not a
 * dead end that loses their plan choice.
 */
export default function PendingClinicSetupResumer() {
  const { userId, state, refresh } = useAppState();

  useEffect(() => {
    if (state.profile.organizationId) return;
    const pending = readPendingClinicSetup();
    if (!pending) return;

    (async () => {
      try {
        const organizationId = await createOrganization(userId, pending.name, pending.plan, pending.billingCycle);
        clearPendingClinicSetup();
        await refresh();
        const { redirectUrl } = await startOrgCheckout(organizationId, pending.plan, pending.billingCycle);
        if (redirectUrl) window.location.href = redirectUrl;
        // Otherwise (demo fallback): no redirect needed, they're already
        // wherever they navigated to after logging in — the Team nav link
        // and welcome banner (Team.tsx) will reflect the new org right away.
      } catch (err) {
        // Leave the flag in place so the next login can retry, rather than
        // silently losing the admin's chosen clinic name and plan.
        console.warn("[CredPulse] Couldn't finish pending clinic setup, will retry next login:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
