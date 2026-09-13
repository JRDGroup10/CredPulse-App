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
          <h1 className="text-heading-sm font-medium text-ink">Billing & plan</h1>
          <p className="text-body text-ink-muted mt-0.5">
            You're currently on <strong className="text-ink">{current.name}</strong>
            {state.profile.plan !== "free" && ` (billed ${state.profile.billingCycle})`}.
          </p>
        </div>
        {state.profile.plan !== "free" && (
          <button onClick={handleManageBilling} disabled={portalLoading} className="btn-secondary text-body px-3.5 py-2 disabled:opacity-50">
            {portalLoading ? "Opening…" : "Manage billing"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-ui border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-body px-4 py-3">
          {error}
        </div>
      )}

      {justChanged && (
        <div className="animate-fade-in-up rounded-ui border border-accent-500/20 bg-accent-500/10 text-accent-700 dark:text-accent-400 text-body px-4 py-3">
          {justChanged === "free"
            ? "You're back on the Free plan."
            : `You're now on ${PLANS[justChanged].name}.`}
        </div>
      )}

      <div className="flex justify-center">
        <div className="inline-flex items-center bg-panel border border-hairline/70 dark:border-hairline/10 rounded-pill p-1">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 rounded-pill text-caption font-medium transition-all ${
              billingCycle === "monthly" ? "bg-canvas text-ink" : "text-ink-faint"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-1.5 rounded-pill text-caption font-medium transition-all ${
              billingCycle === "yearly" ? "bg-canvas text-ink" : "text-ink-faint"
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

      <p className="text-caption text-ink-faint text-center max-w-md mx-auto">
        Upgrades go through real Stripe Checkout once it's configured on the server (falls back to
        an instant demo checkout otherwise). See DEPLOYMENT.md "Payments" to turn on real billing.
      </p>
    </div>
  );
}
