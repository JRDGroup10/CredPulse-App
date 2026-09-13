import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import { generateApiKey, listApiKeys, orgBillingIncomplete, revokeApiKey, getOrganization } from "../lib/store";
import { supabaseUrl } from "../lib/supabaseClient";
import { ApiKey, Organization } from "../lib/types";

/**
 * Admin/owner-only key management for the public API (see
 * supabase/functions/public-api). A new key's plaintext is shown exactly
 * once, right after creation, in `justCreated` below — after that it's
 * gone for good, matching how GitHub/Stripe et al. handle API keys, and
 * matching what's actually true server-side: only the SHA-256 hash is ever
 * stored (see generateApiKey() in store.ts and the api_keys table).
 */
export default function ApiKeys() {
  const { userId, state } = useAppState();
  const { organizationId, orgRole, name, email } = state.profile;
  const isAdmin = orgRole === "owner" || orgRole === "admin";

  const [org, setOrg] = useState<Organization | null>(null);
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load(orgId: string) {
    const [orgData, keyList] = await Promise.all([getOrganization(orgId), listApiKeys(orgId)]);
    setOrg(orgData);
    setKeys(keyList);
  }

  useEffect(() => {
    if (!organizationId || !isAdmin) return;
    load(organizationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, isAdmin]);

  if (!organizationId || !isAdmin) {
    return <Navigate to="/settings" replace />;
  }
  if (org && orgBillingIncomplete(org)) {
    return <Navigate to="/settings" replace />;
  }

  async function handleGenerate() {
    if (!organizationId) return;
    setCreating(true);
    setError(null);
    try {
      const { plaintext } = await generateApiKey(organizationId, userId, label, { name, email });
      setJustCreated(plaintext);
      setLabel("");
      setCopied(false);
      await load(organizationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that key — try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(keyId: string, keyLabel: string) {
    if (!organizationId) return;
    const ok = window.confirm(`Revoke "${keyLabel}"? Anything using this key will stop working immediately.`);
    if (!ok) return;
    await revokeApiKey(keyId, { id: userId, name, email });
    await load(organizationId);
  }

  const apiBase = `${supabaseUrl}/functions/v1/public-api`;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-heading-sm font-medium text-ink">API keys</h1>
          <p className="text-body text-ink-muted mt-0.5">
            Let {org?.name ?? "your team"}'s own systems read and write certification data programmatically.
          </p>
        </div>
        <Link to="/team" className="btn-secondary flex-shrink-0 text-caption px-3 py-1.5 whitespace-nowrap">
          ← Back to Team
        </Link>
      </div>

      {justCreated && (
        <div className="mb-6 rounded-ui border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="text-body font-medium text-amber-700 dark:text-amber-400">
            Copy this key now — you won't be able to see it again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate rounded-ui bg-panel border border-amber-500/20 px-3 py-2 text-body text-ink">
              {justCreated}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(justCreated);
                setCopied(true);
              }}
              className="flex-shrink-0 rounded-ui bg-amber-500 hover:opacity-90 px-3 py-2 text-caption font-medium text-white"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button onClick={() => setJustCreated(null)} className="mt-2 text-caption text-amber-600 dark:text-amber-400 hover:underline">
            Done, dismiss this
          </button>
        </div>
      )}

      <div className="mb-6 card p-4">
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label htmlFor="key-label" className="block text-caption font-medium text-ink-muted mb-1">
              Label (e.g. "Rippling sync")
            </label>
            <input
              id="key-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="What's this key for?"
              className="w-full rounded-ui border border-hairline dark:border-hairline/15 bg-panel px-3 py-2 text-body text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>
          <button onClick={handleGenerate} disabled={creating || !label.trim()} className="btn-primary text-caption px-4 py-2 disabled:opacity-50 whitespace-nowrap">
            {creating ? "Generating…" : "Generate key"}
          </button>
        </div>
        {error && <p className="mt-2 text-caption text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {keys === null ? (
        <p className="text-body text-ink-faint">Loading…</p>
      ) : keys.length === 0 ? (
        <div className="mb-6 rounded-panel border border-dashed border-hairline dark:border-hairline/15 p-8 text-center">
          <p className="text-body text-ink-muted">No API keys yet — generate one above to get started.</p>
        </div>
      ) : (
        <div className="mb-8 card overflow-hidden">
          <table className="w-full text-body">
            <thead>
              <tr className="bg-canvas/40 text-left text-caption font-medium text-ink-faint uppercase tracking-wide">
                <th className="px-4 py-2">Label</th>
                <th className="px-4 py-2">Key</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Last used</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/70 dark:divide-hairline/10">
              {keys.map((k) => (
                <tr key={k.id} className={k.revokedAt ? "opacity-50" : ""}>
                  <td className="px-4 py-2.5 font-medium text-ink">{k.label}</td>
                  <td className="px-4 py-2.5 font-mono text-caption text-ink-muted">
                    {k.keyPrefix}…{k.revokedAt && <span className="ml-1.5 text-red-600 dark:text-red-400">revoked</span>}
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted whitespace-nowrap">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted whitespace-nowrap">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {!k.revokedAt && (
                      <button onClick={() => handleRevoke(k.id, k.label)} className="text-caption font-medium text-red-600 dark:text-red-400 hover:underline">
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card p-4 mb-6">
        <h2 className="text-body font-medium text-ink mb-2">Using your key</h2>
        <p className="text-caption text-ink-muted mb-3">
          Send it as a Bearer token. Every request is scoped to {org?.name ?? "your"} organization only. Run one
          command at a time — pasting several together can confuse some terminals.
        </p>
        {/* Terminal/code block stays a fixed dark chrome in both themes —
            conventional for code snippets and independent of the app's own
            light/dark toggle. */}
        <pre className="text-caption bg-[#0a0a0a] text-[#ededed] rounded-ui p-3 overflow-x-auto">
{`# List clinic-scoped certificates (optionally ?status= or ?email=)
curl "${apiBase}/certificates" \\
  -H "Authorization: Bearer cp_live_..."

# List team members
curl "${apiBase}/members" \\
  -H "Authorization: Bearer cp_live_..."

# Add a certificate for a team member
curl -X POST "${apiBase}/certificates" \\
  -H "Authorization: Bearer cp_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"memberEmail":"jane@example.com","name":"BLS","expiryDate":"2027-06-01"}'`}
        </pre>
      </div>

      <div className="card p-4">
        <h2 className="text-body font-medium text-ink mb-2">HRIS / roster sync</h2>
        <p className="text-caption text-ink-muted mb-3">
          Point your HR system's outbound webhook — or a Zapier/Make automation watching Rippling, Gusto, BambooHR,
          etc. for new-hire or role-change events — at this route. It invites a new hire automatically if they
          aren't already a member or already invited, or updates their name/job title if they are. It never
          touches admin access, plan, or billing.
        </p>
        <pre className="text-caption bg-[#0a0a0a] text-[#ededed] rounded-ui p-3 overflow-x-auto">
{`curl -X POST "${apiBase}/employees" \\
  -H "Authorization: Bearer cp_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"email":"jane@example.com","name":"Jane Doe","role":"Registered Nurse"}'`}
        </pre>
      </div>
    </div>
  );
}
