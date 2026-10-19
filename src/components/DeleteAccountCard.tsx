import { useState } from "react";
import { useAppState } from "../lib/AppContext";
import { deleteAccount, signOut } from "../lib/store";

/**
 * "Delete account" section of Settings. Required by Apple (Guideline 5.1.1(v)):
 * deletion must be reachable inside the app, not just by emailing support.
 * Flow: click Delete account -> read what happens -> type DELETE -> confirm.
 */
export default function DeleteAccountCard() {
  const { userId } = useAppState();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<number | null>(null);
  const [teamAck, setTeamAck] = useState(false);

  const inIosApp = typeof navigator !== "undefined" && navigator.userAgent.includes("CredPulseIOSApp");
  const ready = typed.trim().toUpperCase() === "DELETE" && (teamMembers === null || teamAck);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    const res = await deleteAccount({ deleteTeam: teamMembers !== null && teamAck });
    if (res.ok) {
      try {
        await signOut(userId);
      } catch {
        // The auth user is already gone; a failed local sign-out doesn't matter.
      }
      window.location.href = "/";
      return;
    }
    setBusy(false);
    if (res.code === "owns_team") {
      setTeamMembers(res.memberCount ?? 1);
      setError(null);
      return;
    }
    setError(res.error ?? "Couldn't delete your account. Please try again.");
  }

  return (
    <div className="card p-5">
      <h2 className="font-medium text-ink mb-1">Delete account</h2>
      <p className="text-caption text-ink-muted">
        Permanently delete your account, your certificates and uploaded files. This can't be undone.
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 rounded-ui border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-body font-medium px-3.5 py-2"
        >
          Delete account
        </button>
      ) : (
        <div className="mt-4 space-y-3 animate-fade-in">
          <ul className="text-caption text-ink-muted list-disc pl-5 space-y-1">
            <li>Your profile, certificates, CE credit logs and uploaded files are erased.</li>
            <li>Any web subscription (Stripe) is cancelled right away.</li>
            {inIosApp && (
              <li>
                If you subscribed through the App Store, also cancel it in iPhone Settings → your name → Subscriptions —
                Apple handles those billing records.
              </li>
            )}
          </ul>

          {teamMembers !== null && (
            <label className="flex items-start gap-2 rounded-ui border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-caption text-amber-800 dark:text-amber-300">
              <input type="checkbox" className="mt-0.5" checked={teamAck} onChange={(e) => setTeamAck(e.target.checked)} />
              <span>
                You own a team with {teamMembers} other {teamMembers === 1 ? "member" : "members"}. Deleting your account
                also deletes the team and removes their access to it. Their personal certificates are kept.
              </span>
            </label>
          )}

          <div>
            <label htmlFor="delete-confirm" className="text-caption text-ink-faint block mb-1">
              Type DELETE to confirm
            </label>
            <input
              id="delete-confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              className="w-full max-w-xs rounded-ui border border-hairline dark:border-hairline/15 bg-panel text-ink text-body px-3 py-2"
            />
          </div>

          {error && (
            <div className="rounded-ui border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-caption px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={!ready || busy}
              className="rounded-ui bg-red-600 text-white text-body font-medium px-3.5 py-2 disabled:opacity-40"
            >
              {busy ? "Deleting…" : "Permanently delete my account"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setTyped("");
                setError(null);
                setTeamMembers(null);
                setTeamAck(false);
              }}
              disabled={busy}
              className="btn-secondary text-body px-3.5 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
