export type CredStatus = "expired" | "urgent" | "upcoming" | "valid";

export type Plan = "free" | "plus" | "pro";
export type BillingCycle = "monthly" | "yearly";
export type Region = "CA" | "US";

export interface Certificate {
  id: string;
  name: string; // e.g. "Basic Life Support (BLS)"
  issuer: string; // e.g. "Heart and Stroke Foundation"
  credentialType: "certification" | "license" | "training";
  issuedDate: string; // ISO date
  expiryDate: string; // ISO date
  fileName?: string;
  filePath?: string; // Supabase Storage object path, e.g. "<userId>/169...-bls.pdf"
  notes?: string;
  tip?: string; // e.g. "Renew in person, book ahead — slots fill up." (Plus/Pro only)
  renewalUrl?: string; // direct link to the renewal/booking site (Plus/Pro only)
}

export interface UserProfile {
  name: string;
  role: string; // e.g. "Registered Nurse"
  email: string;
  reminderDays: number[]; // e.g. [90, 30, 7]
  plan: Plan;
  billingCycle: BillingCycle;
  region: Region;
}

export interface AppState {
  profile: UserProfile;
  certificates: Certificate[];
}
