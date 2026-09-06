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
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">API keys</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Let {org?.name ?? "your team"}'s own systems read and write certification data programmatically.
          </p>
        </div>
        <Link
          to="/team"
          className="flex-shrink-0 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
        >
          ← Back to Team
        </Link>
      </div>

      {justCreated && (
        <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Copy this key now — you won't be able to see it again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate rounded-md bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100">
              {justCreated}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(justCreated);
                setCopied(true);
              }}
              className="flex-shrink-0 rounded-md bg-amber-600 hover:bg-amber-700 px-3 py-2 text-xs font-semibold text-white"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setJustCreated(null)}
            className="mt-2 text-xs text-amber-700 dark:text-amber-400 hover:underline"
          >
            Done, dismiss this
          </button>
        </div>
      )}

      <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-card p-4">
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label htmlFor="key-label" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Label (e.g. "Rippling sync")
            </label>
            <input
              id="key-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="What's this key for?"
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={creating || !label.trim()}
            className="rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white whitespace-nowrap"
          >
            {creating ? "Generating…" : "Generate key"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {keys === null ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
      ) : keys.length === 0 ? (
        <div className="mb-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No API keys yet — generate one above to get started.</p>
        </div>
      ) : (
        <div className="mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-2">Label</th>
                <th className="px-4 py-2">Key</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Last used</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {keys.map((k) => (
                <tr key={k.id} className={k.revokedAt ? "opacity-50" : ""}>
                  <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">{k.label}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {k.keyPrefix}…{k.revokedAt && <span className="ml-1.5 text-red-500">revoked</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {!k.revokedAt && (
                      <button
                        onClick={() => handleRevoke(k.id, k.label)}
                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                      >
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

      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Using your key</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Send it as a Bearer token. Every request is scoped to {org?.name ?? "your"} organization only.
        </p>
        <pre className="text-xs bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto">
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
    </div>
  );
}
