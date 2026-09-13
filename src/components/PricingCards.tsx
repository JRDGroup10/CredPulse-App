import { BillingCycle, Plan } from "../lib/types";
import { PLANS, formatPrice, yearlySavingsPct } from "../lib/plans";

const ORDER: Plan[] = ["free", "plus", "pro"];

export default function PricingCards({
  billingCycle,
  currentPlan,
  loadingPlan,
  onAction
}: {
  billingCycle: BillingCycle;
  currentPlan?: Plan;
  loadingPlan?: Plan | null;
  onAction: (plan: Plan) => void;
}) {
  return (
    <div className="grid sm:grid-cols-3 gap-5">
      {ORDER.map((id) => {
        const plan = PLANS[id];
        const price = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
        const isCurrent = currentPlan === id;
        const savings = yearlySavingsPct(plan);

        return (
          <div
            key={id}
            className={`relative rounded-panel border p-6 flex flex-col transition-all duration-200 hover:-translate-y-1 ${
              plan.highlighted ? "bg-brand-500/5 border-brand-500/40 shadow-glow" : "bg-panel border-hairline dark:border-hairline/10"
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-6 badge-pill bg-brand-500 text-white">
                Most popular
              </span>
            )}
            <div className="mb-1 font-medium text-ink">{plan.name}</div>
            <p className="text-caption text-ink-muted mb-4">{plan.tagline}</p>

            <div className="mb-1 flex items-baseline gap-1">
              <span className="text-heading-sm font-medium text-ink">{formatPrice(price)}</span>
              {price > 0 && (
                <span className="text-caption text-ink-faint">/{billingCycle === "yearly" ? "yr" : "mo"}</span>
              )}
            </div>
            <div className="h-5 mb-4">
              {billingCycle === "yearly" && savings > 0 && (
                <span className="badge-pill text-accent-700 dark:text-accent-400 bg-accent-50 dark:bg-accent-500/10">
                  Save {savings}% vs. monthly
                </span>
              )}
            </div>

            <ul className="space-y-2.5 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="text-caption text-ink-muted flex gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-accent-600 dark:text-accent-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onAction(id)}
              disabled={isCurrent || loadingPlan === id}
              className={
                isCurrent
                  ? "w-full text-body font-normal py-2.5 rounded-pill bg-ink/5 text-ink-faint cursor-default"
                  : plan.highlighted
                  ? "btn-primary w-full text-body py-2.5"
                  : "btn-secondary w-full text-body py-2.5"
              }
            >
              {loadingPlan === id ? "Processing…" : isCurrent ? "Current plan" : plan.cta}
            </button>
          </div>
        );
      })}
    </div>
  );
}
