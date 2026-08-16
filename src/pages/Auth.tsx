import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { signIn, signUp } from "../lib/store";
import { supabaseConfigured } from "../lib/supabaseClient";
import { Region } from "../lib/types";
import { rolesForRegion } from "../lib/roles";

type Mode = "signup" | "login";

export default function Auth({ initialMode = "signup" }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [region, setRegion] = useState<Region>("CA");
  const roles = useMemo(() => rolesForRegion(region), [region]);
  const [role, setRole] = useState(roles[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInbox, setCheckInbox] = useState(false);

  function handleRegionChange(next: Region) {
    setRegion(next);
    const nextRoles = rolesForRegion(next);
    if (!nextRoles.includes(role)) setRole(nextRoles[0]);
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
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold mx-auto mb-3 shadow-glow">
            CP
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {mode === "signup" ? "Takes about a minute." : "Log in to see your certifications."}
          </p>
        </div>

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
                  {roles.map((r) => (
                    <option key={r}>{r}</option>
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
