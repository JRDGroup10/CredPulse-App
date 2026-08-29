import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AppContext";
import { createOrganization, signUp, startOrgCheckout } from "../lib/store";
import { savePendingClinicSetup } from "../lib/pendingClinicSetup";
import { supabaseConfigured } from "../lib/supabaseClient";
import { BillingCycle, OrgPlan, Region } from "../lib/types";
import { rolesForRegion } from "../lib/roles";
import { LogoMark } from "../components/Logo";
import TierPicker from "../components/TierPicker";

type Step = "info" | "plan" | "checkInbox";

/**
 * Dedicated signup flow for clinics/teams — deliberately separate from the
 * individual Auth.tsx flow rather than a checkbox bolted onto it, since the
 * two lead to completely different pricing (seat-based here vs. cert-count
 * based for individuals) and a different first-run experience (this ends on
 * a "here's how to get your team set up" screen, not an empty dashboard).
 *
 * Two steps: admin/clinic info, then pick a seat tier. Org creation and
 * checkout only happen after both are collected, on the final submit.
 */
export default function ClinicSignup({ onBack, onLogin }: { onBack?: () => void; onLogin: () => void }) {
  const { refresh } = useAuth();
  const [step, setStep] = useState<Step>("info");

  const [clinicName, setClinicName] = useState("");
  const [name, setName] = useState("");
  const [region, setRegion] = useState<Region>("CA");
  const roles = useMemo(() => rolesForRegion(region), [region]);
  const [role, setRole] = useState(roles[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [plan, setPlan] = useState<OrgPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            key, then restart <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">npm run dev</code>.
          </p>
        </div>
      </div>
    );
  }

  function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("plan");
  }

  async function handleFinish() {
    if (!plan) return;
    setBusy(true);
    setError(null);
    try {
      const { user, session } = await signUp(email, password, name, role, region);
      if (!user) throw new Error("Signup didn't return a user. Please try again.");

      if (!session) {
        // Email confirmation is required — no auth.uid() yet, so the org
        // can't be created until they confirm and log back in. Stash the
        // choice so PendingClinicSetupResumer can finish it then.
        savePendingClinicSetup({ name: clinicName.trim(), plan, billingCycle });
        setStep("checkInbox");
        return;
      }

      const organizationId = await createOrganization(user.id, clinicName.trim(), plan, billingCycle);
      await refresh();
      const { redirectUrl } = await startOrgCheckout(organizationId, plan, billingCycle);
      // Either way the org already exists with a trial. Real Stripe sends
      // them to checkout first; the demo fallback just goes straight to the
      // team dashboard, since signUp() already put a session in place.
      window.location.href = redirectUrl ?? "/team";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "checkInbox") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-slate-950 px-4">
        <div className="max-w-sm w-full text-center animate-fade-in-up">
          <div className="text-3xl mb-3">📬</div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">Check your inbox</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We sent a confirmation link to <strong>{email}</strong>. Click it, then come back and log in —
            we'll pick up right where you left off and set up <strong>{clinicName}</strong> on the{" "}
            {plan} plan automatically.
          </p>
          <button onClick={onLogin} className="mt-5 text-sm font-medium text-brand-600 dark:text-brand-400">
            Back to log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-slate-950 px-4 py-10">
      <div className={`w-full animate-fade-in-up ${step === "plan" ? "max-w-3xl" : "max-w-sm"}`}>
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
            {step === "info" ? "Set up your clinic" : "Choose your plan"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {step === "info"
              ? "One dashboard for your whole team's certification compliance."
              : "Every plan includes a free trial, and everyone you add gets unlimited certs and renewal tips."}
          </p>
        </div>

        {step === "info" && (
          <form
            onSubmit={handleInfoSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-card"
          >
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Clinic/team name</label>
              <input
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                required
                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
                placeholder="Maple Street Clinic"
              />
            </div>
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
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Where is your clinic?</label>
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
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                You can track your own certifications too, alongside the rest of your team.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
                placeholder="you@clinic.com"
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
              className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white text-sm font-medium py-2.5 rounded-lg shadow-glow transition-all hover:-translate-y-0.5"
            >
              Continue to plan selection
            </button>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Signing up as an individual instead?{" "}
              <Link to="/home" className="font-medium text-brand-600 dark:text-brand-400">
                Go back
              </Link>
            </p>
          </form>
        )}

        {step === "plan" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card">
            {error && (
              <div className="text-xs bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <TierPicker
              billingCycle={billingCycle}
              onBillingCycleChange={setBillingCycle}
              selectedPlan={plan}
              onSelectPlan={setPlan}
            />

            <div className="flex items-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => setStep("info")}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={busy || !plan}
                className="flex-1 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg shadow-glow transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                {busy ? "Setting up…" : "Start free trial"}
              </button>
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-4">
          By creating an account you agree to our{" "}
          <Link to="/terms" className="underline hover:text-slate-600 dark:hover:text-slate-300">Terms</Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
