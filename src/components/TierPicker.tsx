import { BillingCycle, OrgPlan } from "../lib/types";
import { ORG_PLANS, ORG_PLAN_ORDER, ORG_TRIAL_DAYS, orgPriceFor } from "../lib/orgPlans";

/**
 * Shared seat-tier picker used by both the dedicated clinic signup wizard
 * (ClinicSignup.tsx) and the existing ad-hoc "Create Team" flow in Settings
 * (TeamSettings.tsx) — every org needs a plan picked at creation time, so
 * both entry points use the exact same card grid rather than drifting apart.
 */
export default function TierPicker({
  billingCycle,
  onBillingCycleChange,
  selectedPlan,
  onSelectPlan
}: {
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  selectedPlan: OrgPlan | null;
  onSelectPlan: (plan: OrgPlan) => void;
}) {
  return (
    <div>
      <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 mb-4">
        <button
          type="button"
          onClick={() => onBillingCycleChange("monthly")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            billingCycle === "monthly"
              ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-slate-50"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onBillingCycleChange("yearly")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            billingCycle === "yearly"
              ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-slate-50"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          Yearly
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ORG_PLAN_ORDER.map((planId) => {
          const plan = ORG_PLANS[planId];
          const price = orgPriceFor(planId, billingCycle);
          const selected = selectedPlan === planId;
          return (
            <button
              key={planId}
              type="button"
              onClick={() => onSelectPlan(planId)}
              className={`text-left border rounded-xl p-4 transition-all ${
                selected
                  ? "border-brand-500 ring-2 ring-brand-200 dark:ring-brand-900 bg-brand-50/50 dark:bg-brand-500/10"
                  : "border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 bg-white dark:bg-slate-900"
              }`}
            >
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{plan.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Up to {plan.seatLimit} team members</div>
              <div className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-50">
                ${price}
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                  /{billingCycle === "yearly" ? "yr" : "mo"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 leading-snug">{plan.tagline}</p>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        {ORG_TRIAL_DAYS}-day free trial on any plan — cancel anytime before it ends and you won't be charged.
      </p>
    </div>
  );
}
