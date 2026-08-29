import { useEffect, useState } from "react";
import { useAppState } from "../lib/AppContext";
import {
  countOrgSeatsUsed,
  createOrganization,
  getOrganization,
  inviteToOrganization,
  listOrgInvites,
  listOrgMembers,
  revokeInvite,
  startOrgCheckout
} from "../lib/store";
import { ORG_PLANS, nextOrgPlanAbove } from "../lib/orgPlans";
import { BillingCycle, Organization, OrgInvite, OrgMember, OrgPlan } from "../lib/types";
import TierPicker from "./TierPicker";

/**
 * Team/Clinic compliance dashboard — settings-page section.
 *
 * Three states, based on the signed-in user's profile:
 *  1. No organizationId yet -> "create a team" flow: name the team, pick a
 *     seat tier (with a free trial), then create. Creating makes this user
 *     the 'owner'. This is the same TierPicker used by the dedicated
 *     ClinicSignup wizard, for anyone who started as an individual and
 *     decides to spin up a team later instead.
 *  2. organizationId set, orgRole is 'owner'/'admin' -> full management:
 *     invite coworkers by email, see members + pending invites, seat usage.
 *  3. organizationId set, orgRole is 'member' -> read-only "you're on a
 *     team" notice. Members don't get admin controls.
 */
export default function TeamSettings() {
  const { userId, state, refresh } = useAppState();
  const { organizationId, orgRole } = state.profile;
  const isAdmin = orgRole === "owner" || orgRole === "admin";

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [seatsUsed, setSeatsUsed] = useState(0);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const [teamName, setTeamName] = useState("");
  const [createPlan, setCreatePlan] = useState<OrgPlan | null>(null);
  const [createCycle, setCreateCycle] = useState<BillingCycle>("monthly");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);

  async function loadTeam(orgId: string) {
    setLoadingTeam(true);
    try {
      const [orgData, memberData, inviteData, seats] = await Promise.all([
        getOrganization(orgId),
        listOrgMembers(orgId),
        isAdmin ? listOrgInvites(orgId) : Promise.resolve([]),
        countOrgSeatsUsed(orgId)
      ]);
      setOrg(orgData);
      setMembers(memberData);
      setInvites(inviteData);
      setSeatsUsed(seats);
    } finally {
      setLoadingTeam(false);
    }
  }

  useEffect(() => {
    if (organizationId) loadTeam(organizationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  async function handleCreate() {
    if (!teamName.trim() || !createPlan) return;
    setCreating(true);
    setCreateError(null);
    try {
      const organizationId = await createOrganization(userId, teamName.trim(), createPlan, createCycle);
      await startOrgCheckout(organizationId, createPlan, createCycle).then(({ redirectUrl }) => {
        if (redirectUrl) window.location.href = redirectUrl;
      });
      await refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Couldn't create team.");
    } finally {
      setCreating(false);
    }
  }

  async function handleInvite() {
    if (!organizationId || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    setInviteSent(false);
    try {
      await inviteToOrganization(organizationId, userId, inviteEmail.trim());
      setInviteEmail("");
      setInviteSent(true);
      await loadTeam(organizationId);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Couldn't send invite.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRevoke(inviteId: string) {
    if (!organizationId) return;
    await revokeInvite(inviteId);
    await loadTeam(organizationId);
  }

  // 1. No team yet.
  if (!organizationId) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card">
        <h2 className="font-medium text-slate-900 dark:text-slate-50 mb-1">Team / Clinic</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Create a team to track certification compliance across your whole staff from one dashboard.
          Coworkers you invite join automatically — no separate signup needed. Certificates they mark
          "For my clinic" are unlimited and show up here; anything personal stays on their own plan and
          private to them.
        </p>

        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Team/clinic name</label>
        <input
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="e.g. Maple Street Clinic"
          className="w-full max-w-sm text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 mb-4"
        />

        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Choose a plan</label>
        <TierPicker
          billingCycle={createCycle}
          onBillingCycleChange={setCreateCycle}
          selectedPlan={createPlan}
          onSelectPlan={setCreatePlan}
        />

        <button
          onClick={handleCreate}
          disabled={creating || !teamName.trim() || !createPlan}
          className="mt-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-glow transition-all whitespace-nowrap"
        >
          {creating ? "Creating…" : "Start free trial"}
        </button>
        {createError && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{createError}</p>}
      </div>
    );
  }

  // 2. Member, not admin -> read-only.
  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card">
        <h2 className="font-medium text-slate-900 dark:text-slate-50 mb-1">Team / Clinic</h2>
        <p className="text-sm text-slate-700 dark:text-slate-200">
          You're part of <span className="font-medium">{org?.name ?? "your team"}</span>.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Your certifications are visible to your team's admin for compliance tracking — not to other
          teammates.
        </p>
      </div>
    );
  }

  // 3. Owner/admin -> full management.
  const seatLimit = org ? ORG_PLANS[org.plan].seatLimit : 0;
  const seatLimitReached = seatsUsed >= seatLimit;
  const upgradeSuggestion = nextOrgPlanAbove(seatLimit);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="font-medium text-slate-900 dark:text-slate-50">{org?.name ?? "Team"}</h2>
        {org && (
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
            {ORG_PLANS[org.plan].name} plan · {seatsUsed}/{seatLimit} seats
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Invite coworkers by email. If they don't have a CredPulse account yet, they'll join your team
        automatically the moment they sign up.
      </p>

      {seatLimitReached && (
        <div className="mb-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          You've used all {seatLimit} seats on the {org ? ORG_PLANS[org.plan].name : ""} plan.
          {upgradeSuggestion
            ? ` Upgrade to ${ORG_PLANS[upgradeSuggestion].name} to invite more teammates.`
            : " You're on the largest plan — contact us if you need more seats."}
        </div>
      )}

      <div className="flex gap-2 max-w-sm mb-2">
        <input
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="coworker@email.com"
          type="email"
          disabled={seatLimitReached}
          className="flex-1 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 disabled:opacity-50"
        />
        <button
          onClick={handleInvite}
          disabled={inviting || !inviteEmail.trim() || seatLimitReached}
          className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-glow transition-all whitespace-nowrap"
        >
          {inviting ? "Sending…" : "Invite"}
        </button>
      </div>
      {inviteError && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{inviteError}</p>}
      {inviteSent && <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">Invite created.</p>}

      {loadingTeam ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-3">Loading team…</p>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <div className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-2">
              Members ({members.length})
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">No members yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-200">
                      {m.name || m.email}
                      {m.role && <span className="text-slate-400 dark:text-slate-500"> — {m.role}</span>}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">{m.orgRole}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {invites.filter((i) => i.status === "pending").length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-2">Pending invites</div>
              <ul className="space-y-1.5">
                {invites
                  .filter((i) => i.status === "pending")
                  .map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{inv.email}</span>
                      <button
                        onClick={() => handleRevoke(inv.id)}
                        className="text-xs font-medium text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                      >
                        Revoke
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
