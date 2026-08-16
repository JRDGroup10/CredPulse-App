import { useState } from "react";
import { useAppState } from "../lib/AppContext";
import { downgradeToFree, openBillingPortal, startCheckout } from "../lib/store";
import { PLANS } from "../lib/plans";
import { Plan, BillingCycle } from "../lib/types";
import PricingCards from "../components/PricingCards";

export default function Billing() {
  const { userId, state, refresh } = useAppState();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(state.profile.billingCycle);
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [justChanged, setJustChanged] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(plan: Plan) {
    if (plan === state.profile.plan) return;
    setError(null);

    if (plan === "free") {
      if (state.profile.plan !== "free") {
        // They're on a paid plan already — send them to the Stripe portal to
        // actually cancel the subscription, rather than silently flipping
        // the DB while Stripe keeps billing them. The webhook flips this
        // record to "free" once Stripe confirms the cancellation.
        await handleManageBilling();
        return;
      }
      await downgradeToFree(userId);
      await refresh();
      setJustChanged("free");
      setTimeout(() => setJustChanged(null), 3000);
      return;
    }

    setLoadingPlan(plan);
    const { redirectUrl } = await startCheckout(userId, plan, billingCycle);
    if (redirectUrl) {
      window.location.href = redirectUrl;
      return; // leaving the page
    }
    // No real Stripe configured — startCheckout already applied the demo checkout.
    await refresh();
    setLoadingPlan(null);
    setJustChanged(plan);
    setTimeout(() => setJustChanged(null), 3000);
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    setError(null);
    const { url, error: portalError } = await openBillingPortal();
    setPortalLoading(false);
    if (url) {
      window.location.href = url;
    } else {
      setError(portalError ?? "Couldn't open billing portal.");
    }
  }

  const current = PLANS[state.profile.plan];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Billing & plan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            You're currently on <strong className="text-slate-700 dark:text-slate-200">{current.name}</strong>
            {state.profile.plan !== "free" && ` (billed ${state.profile.billingCycle})`}.
          </p>
        </div>
        {state.profile.plan !== "free" && (
          <button
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {portalLoading ? "Opening…" : "Manage billing"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {justChanged && (
        <div className="animate-fade-in-up rounded-xl border border-accent-100 dark:border-accent-900 bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 text-sm px-4 py-3">
          {justChanged === "free"
            ? "You're back on the Free plan."
            : `You're now on ${PLANS[justChanged].name}.`}
        </div>
      )}

      <div className="flex justify-center">
        <div className="inline-flex items-center bg-slate-100 dark:bg-slate-900 rounded-full p-1">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              billingCycle === "monthly" ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-slate-50" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              billingCycle === "yearly" ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-slate-50" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      <PricingCards
        billingCycle={billingCycle}
        currentPlan={state.profile.plan}
        loadingPlan={loadingPlan}
        onAction={handleSelect}
      />

      <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center max-w-md mx-auto">
        Upgrades go through real Stripe Checkout once it's configured on the server (falls back to
        an instant demo checkout otherwise). See DEPLOYMENT.md "Payments" to turn on real billing.
      </p>
    </div>
  );
}
