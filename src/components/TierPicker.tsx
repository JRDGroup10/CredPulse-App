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
      <div className="inline-flex items-center bg-panel border border-hairline/70 dark:border-hairline/10 rounded-pill p-1 mb-4">
        <button
          type="button"
          onClick={() => onBillingCycleChange("monthly")}
          className={`px-4 py-1.5 rounded-pill text-caption font-medium transition-all ${
            billingCycle === "monthly" ? "bg-canvas text-ink" : "text-ink-faint"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onBillingCycleChange("yearly")}
          className={`px-4 py-1.5 rounded-pill text-caption font-medium transition-all ${
            billingCycle === "yearly" ? "bg-canvas text-ink" : "text-ink-faint"
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
              className={`text-left card p-4 transition-all ${
                selected ? "border-brand-500/50 ring-2 ring-brand-500/20 bg-brand-500/10" : "hover:border-brand-500/30"
              }`}
            >
              <div className="text-body font-medium text-ink">{plan.name}</div>
              <div className="text-caption text-ink-muted mt-0.5">Up to {plan.seatLimit} team members</div>
              <div className="mt-2 text-subheading font-medium text-ink">
                ${price}
                <span className="text-caption font-normal text-ink-faint">
                  /{billingCycle === "yearly" ? "yr" : "mo"}
                </span>
              </div>
              <p className="text-caption text-ink-faint mt-1.5 leading-snug">{plan.tagline}</p>
            </button>
          );
        })}
      </div>

      <p className="text-caption text-ink-muted mt-3">
        {ORG_TRIAL_DAYS}-day free trial on any plan — cancel anytime before it ends and you won't be charged.
      </p>
    </div>
  );
}
