import { supabase } from "./supabaseClient";
import { AppState, BillingCycle, Certificate, Plan, Region, UserProfile } from "./types";
import { PLANS } from "./plans";
import { Extracted, enrichWithTemplate, mockExtractCertificate } from "./mockExtract";

// ============================================================
// Row <-> app-type mapping (Postgres uses snake_case, the app uses camelCase)
// ============================================================

function mapProfileRow(row: Record<string, unknown> | null, fallbackEmail: string): UserProfile {
  return {
    name: (row?.name as string) ?? "",
    role: (row?.role as string) ?? "",
    email: (row?.email as string) ?? fallbackEmail,
    reminderDays: (row?.reminder_days as number[]) ?? [90, 30, 7],
    plan: ((row?.plan as Plan) ?? "free") as Plan,
    billingCycle: ((row?.billing_cycle as BillingCycle) ?? "monthly") as BillingCycle,
    region: ((row?.region as Region) ?? "CA") as Region
  };
}

function mapCertRow(row: Record<string, unknown>): Certificate {
  return {
    id: row.id as string,
    name: row.name as string,
    issuer: (row.issuer as string) ?? "",
    credentialType: row.credential_type as Certificate["credentialType"],
    issuedDate: (row.issued_date as string) ?? "",
    expiryDate: row.expiry_date as string,
    filePath: (row.file_path as string) ?? undefined,
    tip: (row.tip as string) ?? undefined,
    renewalUrl: (row.renewal_url as string) ?? undefined
  };
}

// ============================================================
// Auth
// ============================================================

export async function signUp(email: string, password: string, name: string, role: string, region: Region) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role, region } }
  });
  if (error) throw error;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ============================================================
// Loading state for the signed-in user
// ============================================================

export async function loadState(userId: string, fallbackEmail: string): Promise<AppState> {
  const [profileRes, certRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("certificates").select("*").eq("user_id", userId).order("expiry_date", { ascending: true })
  ]);

  if (profileRes.error) throw profileRes.error;
  if (certRes.error) throw certRes.error;

  return {
    profile: mapProfileRow(profileRes.data, fallbackEmail),
    certificates: (certRes.data ?? []).map(mapCertRow)
  };
}

// ============================================================
// Profile mutations
// ============================================================

export async function updateProfile(
  userId: string,
  patch: Partial<{
    name: string;
    role: string;
    reminderDays: number[];
    plan: Plan;
    billingCycle: BillingCycle;
    region: Region;
  }>
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.role !== undefined) dbPatch.role = patch.role;
  if (patch.reminderDays !== undefined) dbPatch.reminder_days = patch.reminderDays;
  if (patch.plan !== undefined) dbPatch.plan = patch.plan;
  if (patch.billingCycle !== undefined) dbPatch.billing_cycle = patch.billingCycle;
  if (patch.region !== undefined) dbPatch.region = patch.region;

  const { error } = await supabase.from("profiles").update(dbPatch).eq("id", userId);
  if (error) throw error;
}

/**
 * DEMO ONLY — simulates a successful Stripe Checkout completion by writing
 * the new plan straight to the database. Used as a fallback below if real
 * Stripe checkout isn't configured yet, so the app keeps working in demo
 * mode until you deploy create-checkout-session. See DEPLOYMENT.md.
 */
export async function mockCheckout(userId: string, plan: Plan, billingCycle: BillingCycle): Promise<void> {
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 500));
  await updateProfile(userId, { plan, billingCycle });
}

export async function downgradeToFree(userId: string): Promise<void> {
  await updateProfile(userId, { plan: "free" });
}

/**
 * Starts a real Stripe Checkout session and returns the URL to redirect the
 * browser to. Falls back to the instant mock checkout if the
 * create-checkout-session Edge Function isn't deployed/configured yet, so
 * the upgrade flow keeps working in demo mode either way.
 */
export async function startCheckout(
  userId: string,
  plan: Plan,
  billingCycle: BillingCycle
): Promise<{ redirectUrl: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("create-checkout-session", {
      body: { plan, billingCycle, origin: window.location.origin }
    });
    if (error) throw error;
    if (!data?.url) throw new Error("No checkout URL returned");
    return { redirectUrl: data.url as string };
  } catch (err) {
    console.warn(
      "[CredPulse] Real Stripe checkout unavailable, using demo checkout instead. " +
        "Deploy create-checkout-session and set your Stripe secrets to enable it — see DEPLOYMENT.md.",
      err
    );
    await mockCheckout(userId, plan, billingCycle);
    return { redirectUrl: null };
  }
}

/**
 * Opens the Stripe Customer Billing Portal so a paid user can update their
 * card, view invoices, or cancel — Stripe builds that UI for us. Returns
 * null (with a console warning) if real payments aren't configured yet.
 */
export async function openBillingPortal(): Promise<{ url: string | null; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("create-portal-session", {
      body: { origin: window.location.origin }
    });
    if (error) throw error;
    if (!data?.url) throw new Error("No portal URL returned");
    return { url: data.url as string };
  } catch (err) {
    console.warn("[CredPulse] Billing portal unavailable — real Stripe payments aren't configured yet.", err);
    return { url: null, error: "Billing portal isn't available yet in demo mode." };
  }
}

// ============================================================
// AI extraction
// ============================================================

/**
 * Sends the uploaded file to the extract-certificate Edge Function, which
 * calls Claude to read the document and return structured fields. Falls back
 * to the local demo extractor (mockExtractCertificate) if the Edge Function
 * isn't deployed yet, isn't configured (no ANTHROPIC_API_KEY secret set), or
 * the request fails for any reason — so the app keeps working end-to-end
 * even before you've wired up the real extraction. See DEPLOYMENT.md.
 */
export async function extractCertificate(file: File, region: Region): Promise<Extracted> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("region", region);

    const { data, error } = await supabase.functions.invoke("extract-certificate", { body: formData });
    if (error) throw error;
    if (!data || typeof data.name !== "string" || typeof data.expiryDate !== "string") {
      throw new Error("Malformed response from extraction function");
    }

    return enrichWithTemplate(
      {
        name: data.name,
        issuer: data.issuer ?? "",
        credentialType: data.credentialType ?? "certification",
        issuedDate: data.issuedDate ?? "",
        expiryDate: data.expiryDate,
        confidence: typeof data.confidence === "number" ? data.confidence : 0.7
      },
      region
    );
  } catch (err) {
    console.warn(
      "[CredPulse] Real AI extraction unavailable, using demo extraction instead. " +
        "Deploy the extract-certificate Edge Function and set ANTHROPIC_API_KEY to enable it — see DEPLOYMENT.md.",
      err
    );
    return mockExtractCertificate(file, region);
  }
}

// ============================================================
// Certificate mutations
// ============================================================

export async function addCertificate(
  userId: string,
  cert: Omit<Certificate, "id">,
  file?: File | null
): Promise<void> {
  let filePath: string | null = null;

  if (file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("certificates").upload(path, file);
    if (uploadError) throw uploadError;
    filePath = path;
  }

  const { error } = await supabase.from("certificates").insert({
    user_id: userId,
    name: cert.name,
    issuer: cert.issuer,
    credential_type: cert.credentialType,
    issued_date: cert.issuedDate || null,
    expiry_date: cert.expiryDate,
    tip: cert.tip || null,
    renewal_url: cert.renewalUrl || null,
    file_path: filePath
  });
  if (error) throw error;
}

export async function removeCertificate(certId: string, filePath?: string): Promise<void> {
  if (filePath) {
    await supabase.storage.from("certificates").remove([filePath]);
  }
  const { error } = await supabase.from("certificates").delete().eq("id", certId);
  if (error) throw error;
}

/** Signed, time-limited URL for viewing/downloading an uploaded cert file. */
export async function getCertificateFileUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("certificates").createSignedUrl(filePath, 60 * 5);
  if (error) return null;
  return data.signedUrl;
}

// ============================================================
// Pure helpers — plan/date logic, no storage dependency, unchanged
// regardless of where the data lives.
// ============================================================

export function certLimit(state: AppState): number {
  return PLANS[state.profile.plan].certLimit;
}

export function certLimitReached(state: AppState): boolean {
  return state.certificates.length >= certLimit(state);
}

export function canUseTipsAndLinks(state: AppState): boolean {
  return PLANS[state.profile.plan].includesTipsAndLinks;
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

type CredStatusLike = "expired" | "urgent" | "upcoming" | "valid";

export function statusFor(dateStr: string): CredStatusLike {
  const days = daysUntil(dateStr);
  if (days < 0) return "expired";
  if (days <= 14) return "urgent";
  if (days <= 60) return "upcoming";
  return "valid";
}

export const STATUS_STYLES: Record<CredStatusLike, { label: string; bg: string; text: string; dot: string; ring: string }> = {
  expired: { label: "Expired", bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400", dot: "bg-red-500", ring: "#ef4444" },
  urgent: { label: "Renew now", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500", ring: "#f59e0b" },
  upcoming: { label: "Upcoming", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500", ring: "#3b82f6" },
  valid: { label: "Valid", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", ring: "#10b981" }
};
