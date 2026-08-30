import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { signIn, signUp } from "../lib/store";
import { supabaseConfigured } from "../lib/supabaseClient";
import { Region } from "../lib/types";
import { orderedRoleGroups } from "../lib/roles";
import { getIndustryPref } from "../lib/industryPref";
import { LogoMark } from "../components/Logo";
type Mode = "signup" | "login";

export default function Auth({
  initialMode = "signup",
  onBack,
  joiningOrgName
}: {
  initialMode?: Mode;
  onBack?: () => void;
  /** Set when arriving from a team-invite link (see JoinTeam.tsx) — shows a
   * banner confirming this account will be connected to that clinic, not a
   * standalone individual one, since the auto-link happens invisibly via
   * handle_new_user() otherwise and the signup form looks identical either
   * way without this. */
  joiningOrgName?: string;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [region, setRegion] = useState<Region>("CA");
  // Which group of roles leads the dropdown — the group matching whichever
  // side of the homepage split-screen chooser this visitor picked (see
  // lib/industryPref.ts), so a construction worker signing up doesn't have
  // to scroll past two dozen healthcare titles to find their own.
  const preferOther = useMemo(() => getIndustryPref() === "other", []);
  const roleGroups = useMemo(() => orderedRoleGroups(region, preferOther), [region, preferOther]);
  const [role, setRole] = useState(roleGroups[0].roles[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInbox, setCheckInbox] = useState(false);

  function handleRegionChange(next: Region) {
    setRegion(next);
    const nextGroups = orderedRoleGroups(next, preferOther);
    if (!nextGroups.some((g) => g.roles.includes(role))) setRole(nextGroups[0].roles[0]);
  }

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-slate-950 px-4">
        <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 rounded-xl p-5 text-sm animate-fade-in-up">
          <div className="font-semibold text-amber-700 dark:text-amber-400 mb-2">Supabase isn't configured yet</div>
          <p className="text-slate-600 dark:text-slate-300">
            Copy <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">.env.example</code> to{" "}
            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">.env.local</code>, fill in your Supabase project URL and anon
            key, then restart <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">npm run dev</code>. See README.md for the
            full setup steps.
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(email, password, name, role, region);
        // If email confirmation is required, Supabase won't return a session yet.
        setCheckInbox(true);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (checkInbox) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-slate-950 px-4">
        <div className="max-w-sm w-full text-center animate-fade-in-up">
          <div className="text-3xl mb-3">📬</div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">Check your inbox</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We sent a confirmation link to <strong>{email}</strong>. Click it, then come back and log in.
          </p>
          <button
            onClick={() => {
              setCheckInbox(false);
              setMode("login");
            }}
            className="mt-5 text-sm font-medium text-brand-600 dark:text-brand-400"
          >
            Back to log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-slate-950 px-4">
      <div className="max-w-sm w-full animate-fade-in-up">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.56l4.22 4.22a.75.75 0 11-1.06 1.06l-5.5-5.5a.75.75 0 010-1.06l5.5-5.5a.75.75 0 111.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back to homepage
          </button>
        )}
        <div className="text-center mb-8">
          <LogoMark className="w-14 h-14 mx-auto mb-3 drop-shadow-md" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {mode === "signup" ? "Takes about a minute." : "Log in to see your certifications."}
          </p>
        </div>

        {joiningOrgName && mode === "signup" && (
          <div className="mb-4 rounded-xl border border-brand-100 dark:border-brand-900 bg-brand-50 dark:bg-brand-500/10 px-4 py-3 text-sm text-brand-800 dark:text-brand-300">
            🏥 You're setting up your account to join <strong>{joiningOrgName}</strong>. Your clinic's plan
            already covers your certifications — no separate subscription needed.
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-card">
          {error && (
            <div className="text-xs bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">{error}</div>
          )}

          {mode === "signup" && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Your name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Where do you practice?</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["CA", "US"] as Region[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRegionChange(r)}
                      className={`text-sm font-medium py-2 rounded-lg border transition-all ${
                        region === r
                          ? "bg-brand-600 border-brand-600 text-white shadow-glow"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-600"
                      }`}
                    >
                      {r === "CA" ? "🇨🇦 Canada" : "🇺🇸 United States"}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Sets the renewal sites and terminology we show you — you can change this later.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Your role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
                >
                  {roleGroups.map((g) => (
                    <optgroup label={g.label} key={g.label}>
                      {g.roles.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg shadow-glow transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
          >
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </button>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="font-medium text-brand-600 dark:text-brand-400"
            >
              {mode === "signup" ? "Log in" : "Create an account"}
            </button>
          </p>
        </form>

        {mode === "signup" && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-4">
            By creating an account you agree to our{" "}
            <Link to="/terms" className="underline hover:text-slate-600 dark:hover:text-slate-300">Terms</Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
