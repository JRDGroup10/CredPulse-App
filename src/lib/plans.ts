import { Plan } from "./types";

export interface PlanDetails {
  id: Plan;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  certLimit: number; // Infinity for unlimited
  reminderCadence: string;
  includesTipsAndLinks: boolean;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export const PLANS: Record<Plan, PlanDetails> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Track the basics, no cost.",
    priceMonthly: 0,
    priceYearly: 0,
    certLimit: 2,
    reminderCadence: "One monthly summary reminder for anything expiring soon",
    includesTipsAndLinks: false,
    features: [
      "Track up to 2 certifications",
      "Monthly expiry reminder email",
      "Manual entry or upload"
    ],
    cta: "Get started free"
  },
  plus: {
    id: "plus",
    name: "Plus",
    tagline: "For most working practitioners.",
    priceMonthly: 4.99,
    priceYearly: 54,
    certLimit: 5,
    reminderCadence: "Custom reminders at 90 / 30 / 7 days before expiry",
    includesTipsAndLinks: true,
    features: [
      "Track up to 5 certifications",
      "Custom reminder schedule (90/30/7 days, your choice)",
      "Renewal tips for each credential",
      "Direct links to the exact renewal/booking page"
    ],
    cta: "Upgrade to Plus",
    highlighted: true
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For multi-credential and specialist roles.",
    priceMonthly: 9.45,
    priceYearly: 95,
    certLimit: Infinity,
    reminderCadence: "Custom reminders at 90 / 30 / 7 days before expiry",
    includesTipsAndLinks: true,
    features: [
      "Unlimited certifications",
      "Custom reminder schedule (90/30/7 days, your choice)",
      "Renewal tips for each credential",
      "Direct links to the exact renewal/booking page"
    ],
    cta: "Upgrade to Pro"
  }
};

export function yearlySavingsPct(plan: PlanDetails): number {
  if (plan.priceMonthly === 0) return 0;
  const annualizedMonthly = plan.priceMonthly * 12;
  return Math.round((1 - plan.priceYearly / annualizedMonthly) * 100);
}

export function formatPrice(n: number): string {
  return n === 0 ? "$0" : `$${n.toFixed(2).replace(/\.00$/, "")}`;
}
