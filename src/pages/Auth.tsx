import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AppContext";
import { getAccountIndustry, signIn, signOut, signUp } from "../lib/store";
import { supabaseConfigured } from "../lib/supabaseClient";
import { Region } from "../lib/types";
import { orderedRoleGroups } from "../lib/roles";
import { getIndustryPref, setIndustryPref, IndustryPref } from "../lib/industryPref";
import { peekReferralCode, consumeReferralCode } from "../lib/referralCapture";
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
  const { setAuthGating } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [region, setRegion] = useState<Region>("CA");
  // Which group of roles leads the dropdown — the group matching whichever
  // side of the homepage split-screen chooser this visitor picked (see
  // lib/industryPref.ts), so a construction worker signing up doesn't have
  // to scroll past two dozen healthcare titles to find their own.
  const preferOther = useMemo(() => getIndustryPref() === "other", []);
  const industry: IndustryPref = preferOther ? "other" : "healthcare";
  const roleGroups = useMemo(() => orderedRoleGroups(region, preferOther), [region, preferOther]);
  const [role, setRole] = useState(roleGroups[0].roles[0]);
  // Captured earlier from a "?ref=<code>" link (see App.tsx calling
  // captureReferralFromUrl() on boot) — shown here just as a friendly hint;
  // the actual linking/reward happens server-side in handle_new_user() once
  // signUp() passes the code through.
  const referralCode = useMemo(() => peekReferralCode(), []);
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
      <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
        <div className="max-w-sm w-full card border-amber-500/30 p-5 text-body animate-fade-in-up">
          <div className="font-medium text-amber-500 mb-2">Supabase isn't configured yet</div>
          <p className="text-ink-muted">
            Copy <code className="bg-ink/5 px-1 rounded-ui">.env.example</code> to{" "}
            <code className="bg-ink/5 px-1 rounded-ui">.env.local</code>, fill in your Supabase project URL and anon
            key, then restart <code className="bg-ink/5 px-1 rounded-ui">npm run dev</code>. See README.md for the
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
        await signUp(email, password, name, role, region, industry, referralCode);
        // Only clear the stored code once signUp() has actually succeeded —
        // if it throws (weak password, email taken, etc.) the code should
        // still be there for the retry.
        consumeReferralCode();
        // If email confirmation is required, Supabase won't return a session yet.
        setCheckInbox(true);
      } else {
        // Gating only covers the login path — this is the only case with a
        // real race condition (see AppContext.tsx: Supabase marks the
        // session signed-in the instant signIn() resolves, before the
        // industry check below can run, so App.tsx needs a signal to hold
        // on a spinner instead of flashing the dashboard). Signup has no
        // such risk, and wrapping it here previously caused this whole Auth
        // component to get replaced by that spinner mid-submit — wiping out
        // the "Check your inbox" screen's local state before it could show.
        setAuthGating(true);
        try {
          const { user } = await signIn(email, password);
          if (user) {
            // This account was created on one specific side of the homepage
            // split-screen chooser (see lib/industryPref.ts) and can only
            // log in from that same side — otherwise a healthcare account
            // could wander into the construction/education/policing page
            // and vice versa, which is confusing and not what either side
            // promises.
            const accountIndustry = await getAccountIndustry(user.id);
            if (accountIndustry !== industry) {
              await signOut(user.id);
              // Correct the device's remembered preference to match the
              // real account, so "Back to homepage" below — and any future
              // visit — lands them on the right page without choosing again.
              setIndustryPref(accountIndustry);
              setError(
                accountIndustry === "healthcare"
                  ? "This account was created on the healthcare page. Go back and switch industries to log in."
                  : "This account was created on the other-industries page. Go back and switch industries to log in."
              );
              return;
            }
          }
        } finally {
          setAuthGating(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (checkInbox) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
        <div className="max-w-sm w-full text-center animate-fade-in-up">
          <div className="text-3xl mb-3">📬</div>
          <h1 className="text-subheading font-medium text-ink mb-2">Check your inbox</h1>
          <p className="text-body text-ink-muted">
            We sent a confirmation link to <strong>{email}</strong>. Click it, then come back and log in.
          </p>
          <button
            onClick={() => {
              setCheckInbox(false);
              setMode("login");
            }}
            className="mt-5 text-body font-medium text-brand-400"
          >
            Back to log in
          </button>
        </div>
      </div>
    );
  }

  // Shared input treatment (Dimension's source doc has no form patterns —
  // see CRE-18): graphite fill, hairline border, ink text, brand-accent
  // focus ring. Matches the <select> treatment already shipped on Dashboard.
  // Placeholder uses ink-muted rather than the fainter ink-faint token —
  // ink-faint against the dark-mode panel fill (#161616) checks out to
  // roughly 3.2:1, short of WCAG AA's 4.5:1 for text; ink-muted clears it
  // comfortably (~10:1) while staying visually secondary to filled-in ink text.
  const inputClass =
    "w-full border border-hairline dark:border-hairline/15 bg-panel text-ink placeholder:text-ink-muted rounded-ui px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition";
  const labelClass = "block text-caption font-medium text-ink-muted mb-1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="max-w-sm w-full animate-fade-in-up">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1 text-body font-medium text-ink-muted hover:text-ink transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.56l4.22 4.22a.75.75 0 11-1.06 1.06l-5.5-5.5a.75.75 0 010-1.06l5.5-5.5a.75.75 0 111.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back to homepage
          </button>
        )}
        <div className="text-center mb-8">
          <LogoMark className="w-14 h-14 mx-auto mb-3" />
          <h1 className="text-subheading font-medium text-ink">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-body text-ink-muted mt-1">
            {mode === "signup" ? "Takes about a minute." : "Log in to see your certifications."}
          </p>
        </div>

        {joiningOrgName && mode === "signup" && (
          <div className="mb-4 rounded-ui border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-body text-brand-400">
            🏥 You're setting up your account to join <strong>{joiningOrgName}</strong>. Your clinic's plan
            already covers your certifications — no separate subscription needed.
          </div>
        )}

        {!joiningOrgName && referralCode && mode === "signup" && (
          <div className="mb-4 rounded-ui border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-body text-emerald-500">
            🎁 You were invited by a friend to try CredPulse.
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          {error && (
            <div className="text-caption bg-red-500/10 text-red-500 border border-red-500/20 rounded-ui px-3 py-2">{error}</div>
          )}

          {mode === "signup" && (
            <>
              <div>
                <label htmlFor="auth-name" className={labelClass}>Your name</label>
                <input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className={labelClass}>Where do you practice?</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["CA", "US"] as Region[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRegionChange(r)}
                      className={`text-body font-medium py-2 rounded-ui border transition-all ${
                        region === r
                          ? "bg-brand-500/10 border-brand-500/40 text-brand-400"
                          : "bg-panel border-hairline dark:border-hairline/15 text-ink-muted hover:border-brand-500/30"
                      }`}
                    >
                      {r === "CA" ? "🇨🇦 Canada" : "🇺🇸 United States"}
                    </button>
                  ))}
                </div>
                <p className="text-caption text-ink-faint mt-1">
                  Sets the renewal sites and terminology we show you — you can change this later.
                </p>
              </div>
              <div>
                <label htmlFor="auth-role" className={labelClass}>Your role</label>
                <select id="auth-role" value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
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
            <label htmlFor="auth-email" className={labelClass}>Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className={labelClass}>Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
              placeholder="At least 6 characters"
            />
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full text-body py-2.5 disabled:opacity-50">
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </button>

          <p className="text-caption text-ink-muted text-center">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="font-medium text-brand-400"
            >
              {mode === "signup" ? "Log in" : "Create an account"}
            </button>
          </p>
        </form>

        {mode === "signup" && (
          <p className="text-caption text-ink-faint text-center mt-4">
            By creating an account you agree to our{" "}
            <Link to="/terms" className="underline hover:text-ink-muted">Terms</Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-ink-muted">Privacy Policy</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
