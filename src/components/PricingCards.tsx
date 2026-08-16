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
            className={`relative rounded-2xl border p-6 flex flex-col bg-white dark:bg-slate-900 transition-all duration-200 hover:-translate-y-1 ${
              plan.highlighted
                ? "border-brand-500 dark:border-brand-500 shadow-glow ring-1 ring-brand-100 dark:ring-brand-900"
                : "border-slate-200 dark:border-slate-800 hover:shadow-card"
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-6 bg-gradient-to-r from-brand-600 to-brand-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow">
                Most popular
              </span>
            )}
            <div className="mb-1 font-semibold text-slate-900 dark:text-slate-50">{plan.name}</div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{plan.tagline}</p>

            <div className="mb-1 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{formatPrice(price)}</span>
              {price > 0 && (
                <span className="text-sm text-slate-400 dark:text-slate-500">/{billingCycle === "yearly" ? "yr" : "mo"}</span>
              )}
            </div>
            <div className="h-5 mb-4">
              {billingCycle === "yearly" && savings > 0 && (
                <span className="text-xs font-medium text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-500/10 px-2 py-0.5 rounded-full">
                  Save {savings}% vs. monthly
                </span>
              )}
            </div>

            <ul className="space-y-2.5 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2">
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
              className={`w-full text-sm font-medium py-2.5 rounded-lg transition-all ${
                isCurrent
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default"
                  : plan.highlighted
                  ? "bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white shadow-glow hover:-translate-y-0.5"
                  : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white hover:-translate-y-0.5"
              }`}
            >
              {loadingPlan === id ? "Processing…" : isCurrent ? "Current plan" : plan.cta}
            </button>
          </div>
        );
      })}
    </div>
  );
}
