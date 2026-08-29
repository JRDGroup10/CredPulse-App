import { BillingCycle, OrgPlan } from "./types";

// If a clinic admin signs up but their Supabase project requires email
// confirmation, there's no session yet — and therefore no auth.uid() for
// the organizations RLS insert policy to check — so we can't create the org
// right at signup. Instead we stash their chosen clinic name/plan/cycle
// here, and PendingClinicSetupResumer.tsx finishes the job the next time
// they log in with an empty organizationId. See ClinicSignup.tsx.
export const PENDING_CLINIC_KEY = "credpulse-pending-clinic-setup";

export interface PendingClinicSetup {
  name: string;
  plan: OrgPlan;
  billingCycle: BillingCycle;
}

export function savePendingClinicSetup(setup: PendingClinicSetup): void {
  window.localStorage.setItem(PENDING_CLINIC_KEY, JSON.stringify(setup));
}

export function readPendingClinicSetup(): PendingClinicSetup | null {
  const raw = window.localStorage.getItem(PENDING_CLINIC_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingClinicSetup;
  } catch {
    window.localStorage.removeItem(PENDING_CLINIC_KEY);
    return null;
  }
}

export function clearPendingClinicSetup(): void {
  window.localStorage.removeItem(PENDING_CLINIC_KEY);
}
