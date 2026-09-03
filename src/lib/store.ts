import { supabase } from "./supabaseClient";
import {
  AppState,
  BillingCycle,
  CertScope,
  Certificate,
  OrgInvite,
  OrgInviteWithOrgName,
  OrgMember,
  OrgPlan,
  OrgRole,
  OrgSubscriptionStatus,
  Organization,
  Plan,
  Region,
  UserProfile
} from "./types";
import { IndustryPref } from "./industryPref";
import { PLANS } from "./plans";
import { ORG_PLANS, nextOrgPlanAbove } from "./orgPlans";
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
    region: ((row?.region as Region) ?? "CA") as Region,
    organizationId: (row?.organization_id as string) ?? null,
    orgRole: ((row?.org_role as OrgRole) ?? "member") as OrgRole,
    industry: ((row?.industry as IndustryPref) ?? "healthcare") as IndustryPref
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
    renewalUrl: (row.renewal_url as string) ?? undefined,
    scope: ((row.scope as CertScope) ?? "personal") as CertScope
  };
}

// ============================================================
// Auth
// ============================================================

/**
 * Returns the raw signUp result (not just void) because callers that need to
 * act immediately afterward — like ClinicSignup creating the org right
 * away — need the new user's id, and need to know whether a session came
 * back immediately or whether email confirmation is required first (in
 * which case `session` is null and there's no auth.uid() yet for RLS).
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: string,
  region: Region,
  industry: IndustryPref
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role, region, industry } }
  });
  if (error) throw error;
  return data;
}

/** Returns the signed-in user (or null, if this project requires MFA/other
 * follow-up before a session exists) so callers can immediately check
 * things like the account's industry — see getAccountIndustry() below and
 * the login gate in Auth.tsx. */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Which side of the homepage split-screen chooser this account was created
 * under — set once at signup, never user-editable. Used right after signIn()
 * to gate a healthcare account out of the other-industries page and vice
 * versa (see Auth.tsx). */
export async function getAccountIndustry(userId: string): Promise<IndustryPref> {
  const { data, error } = await supabase.from("profiles").select("industry").eq("id", userId).maybeSingle();
  if (error) throw error;
  return ((data?.industry as IndustryPref) ?? "healthcare") as IndustryPref;
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
    organizationId: string | null;
    orgRole: OrgRole;
  }>
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.role !== undefined) dbPatch.role = patch.role;
  if (patch.reminderDays !== undefined) dbPatch.reminder_days = patch.reminderDays;
  if (patch.plan !== undefined) dbPatch.plan = patch.plan;
  if (patch.billingCycle !== undefined) dbPatch.billing_cycle = patch.billingCycle;
  if (patch.region !== undefined) dbPatch.region = patch.region;
  if (patch.organizationId !== undefined) dbPatch.organization_id = patch.organizationId;
  if (patch.orgRole !== undefined) dbPatch.org_role = patch.orgRole;

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
 * Starts a real Stripe Checkout session for a clinic/team's seat-based plan,
 * with a free trial (see ORG_TRIAL_DAYS in orgPlans.ts) built into the
 * subscription.
 *
 * IMPORTANT: a new org is created with subscription_status = 'incomplete'
 * and no trial_ends_at (see organizations-schema.sql) — it does NOT get
 * dashboard access until Stripe confirms checkout.session.completed via the
 * webhook, which is what actually flips it to 'trialing'. If this call
 * fails or the redirect URL is never returned (e.g. the Edge Function isn't
 * deployed, or the admin abandons the Stripe Checkout page), the org
 * correctly stays 'incomplete' and orgBillingIncomplete() below will keep
 * showing the "finish setting up billing" screen instead of the dashboard
 * — there's no silent free-trial fallback anymore, on purpose.
 */
export async function startOrgCheckout(
  organizationId: string,
  plan: OrgPlan,
  billingCycle: BillingCycle
): Promise<{ redirectUrl: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("create-org-checkout-session", {
      body: { organizationId, plan, billingCycle, origin: window.location.origin }
    });
    if (error) throw error;
    if (!data?.url) throw new Error("No checkout URL returned");
    return { redirectUrl: data.url as string };
  } catch (err) {
    console.warn(
      "[CredPulse] Couldn't start Stripe checkout for this org — it stays 'incomplete' until this " +
        "succeeds. Check that create-org-checkout-session is deployed and the Stripe org price " +
        "secrets are set.",
      err
    );
    return { redirectUrl: null };
  }
}

/** True until a clinic has actually completed Stripe Checkout — the org
 * exists (so an owner and members can be attached to it) but shouldn't get
 * dashboard access, invite ability, or unlimited clinic-scoped certs yet.
 * See the schema.sql comment on the 'incomplete' default for why. */
export function orgBillingIncomplete(org: Organization): boolean {
  return org.subscriptionStatus === "incomplete";
}

/**
 * Changes an existing, already-paying org to a different seat tier by
 * swapping the price on its live Stripe subscription in place (prorated),
 * rather than starting a brand-new checkout session — see
 * update-org-plan Edge Function. Owner/admin only; the function itself
 * re-checks that server-side, this isn't just a client-side gate.
 */
export async function updateOrgPlan(
  organizationId: string,
  plan: OrgPlan,
  billingCycle: BillingCycle
): Promise<void> {
  const { data, error } = await supabase.functions.invoke("update-org-plan", {
    body: { organizationId, plan, billingCycle }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error as string);
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
    file_path: filePath,
    scope: cert.scope
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
// Organizations (Team/Clinic compliance dashboard)
//
// There's no separate "clinic signup" — any user can create a team here and
// becomes its 'owner'; anyone they invite by email joins as 'member', either
// automatically (if they don't have an account yet — see handle_new_user()
// in supabase/organizations-schema.sql) or by accepting manually below.
// ============================================================

/**
 * Creates a brand-new team/clinic. Every org needs a seat-based plan from
 * the moment it exists — there's no "free" org tier. The row starts in
 * 'incomplete' status with no trial yet (see organizations-schema.sql) —
 * the caller MUST immediately follow this with startOrgCheckout() and send
 * the admin to Stripe, since dashboard access stays blocked until Stripe
 * confirms checkout.session.completed and flips the status to 'trialing'.
 */
export async function createOrganization(
  userId: string,
  name: string,
  plan: OrgPlan,
  billingCycle: BillingCycle,
  industry: IndustryPref
): Promise<string> {
  const { data, error } = await supabase
    .from("organizations")
    .insert({ name: name.trim(), owner_id: userId, plan, billing_cycle: billingCycle, industry })
    .select("id")
    .single();
  if (error) throw error;

  const organizationId = data.id as string;
  await updateProfile(userId, { organizationId, orgRole: "owner" });
  return organizationId;
}

export async function getOrganization(organizationId: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, owner_id, plan, billing_cycle, subscription_status, trial_ends_at, industry")
    .eq("id", organizationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id as string,
    name: data.name as string,
    ownerId: data.owner_id as string,
    plan: (data.plan as OrgPlan) ?? "starter",
    billingCycle: (data.billing_cycle as BillingCycle) ?? "monthly",
    subscriptionStatus: (data.subscription_status as OrgSubscriptionStatus) ?? "trialing",
    trialEndsAt: (data.trial_ends_at as string) ?? null,
    industry: ((data.industry as IndustryPref) ?? "healthcare") as IndustryPref
  };
}

export interface IndustryBenchmark {
  /** Average, across every billing-active org in the industry, of "% of
   * that org's clinic-scoped certificates that are currently not expired." */
  avgCompliancePct: number;
  /** How many organizations fed into that average — surfaced in the UI
   * ("based on N clinics") so the number doesn't read as more authoritative
   * than it is. */
  clinicCount: number;
}

/** Below this many contributing organizations, the "average" is thin
 * enough that an admin could functionally back out one or two other real
 * clinics' numbers from it — so we just don't show it at all rather than
 * risk that. See industry_compliance_benchmarks in
 * organizations-schema.sql, which computes the aggregate this reads. */
const MIN_BENCHMARK_SAMPLE = 4;

/** Anonymized "how does my clinic compare" stat for Team.tsx — never
 * returns anything below MIN_BENCHMARK_SAMPLE contributing organizations,
 * and never exposes anything more granular than the industry-wide average. */
export async function getIndustryBenchmark(industry: IndustryPref): Promise<IndustryBenchmark | null> {
  const { data, error } = await supabase
    .from("industry_compliance_benchmarks")
    .select("clinic_count, avg_compliance_pct")
    .eq("industry", industry)
    .maybeSingle();
  if (error) {
    console.warn("[CredPulse] Couldn't load the industry benchmark — hiding that card.", error);
    return null;
  }
  if (!data || (data.clinic_count as number) < MIN_BENCHMARK_SAMPLE) return null;
  return {
    clinicCount: data.clinic_count as number,
    avgCompliancePct: Number(data.avg_compliance_pct)
  };
}

/** How many of the org's seats are already spoken for — current members
 * plus pending (not-yet-accepted) invites, so you can't over-invite past
 * what you're paying for even before those invites are accepted. */
export async function countOrgSeatsUsed(organizationId: string): Promise<number> {
  const [membersRes, invitesRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase
      .from("organization_invites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending")
  ]);
  if (membersRes.error) throw membersRes.error;
  if (invitesRes.error) throw invitesRes.error;
  return (membersRes.count ?? 0) + (invitesRes.count ?? 0);
}

export async function inviteToOrganization(organizationId: string, invitedBy: string, email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  // Enforce the seat limit before creating the invite — better to block
  // here with a clear upgrade message than to let someone invite past what
  // their plan covers.
  const org = await getOrganization(organizationId);
  if (org) {
    const seatLimit = ORG_PLANS[org.plan].seatLimit;
    const seatsUsed = await countOrgSeatsUsed(organizationId);
    if (seatsUsed >= seatLimit) {
      const suggestion = nextOrgPlanAbove(seatLimit);
      throw new Error(
        suggestion
          ? `You've used all ${seatLimit} seats on your ${ORG_PLANS[org.plan].name} plan. Upgrade to ${ORG_PLANS[suggestion].name} to invite more teammates.`
          : `You've used all ${seatLimit} seats on your ${ORG_PLANS[org.plan].name} plan.`
      );
    }
  }

  const { error } = await supabase.from("organization_invites").insert({
    organization_id: organizationId,
    invited_by: invitedBy,
    email: normalizedEmail
  });
  if (error) throw error;

  // Best-effort: let the invited person know by email. If this fails (mail
  // service hiccup, secret not set yet, etc.) the invite row still exists —
  // they'll still auto-join on signup, or see the accept banner on login.
  try {
    const [org, inviterProfile] = await Promise.all([
      getOrganization(organizationId),
      supabase.from("profiles").select("name").eq("id", invitedBy).maybeSingle()
    ]);
    await supabase.functions.invoke("send-team-invite", {
      body: {
        email: normalizedEmail,
        organizationName: org?.name ?? "your team",
        inviterName: (inviterProfile.data?.name as string) || "A CredPulse user"
      }
    });
  } catch (err) {
    console.warn("[CredPulse] Couldn't send invite email (invite was still created):", err);
  }
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.from("organization_invites").update({ status: "revoked" }).eq("id", inviteId);
  if (error) throw error;
}

export async function listOrgInvites(organizationId: string): Promise<OrgInvite[]> {
  const { data, error } = await supabase
    .from("organization_invites")
    .select("id, email, status, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    email: r.email as string,
    status: r.status as OrgInvite["status"],
    createdAt: r.created_at as string
  }));
}

export async function listOrgMembers(organizationId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, org_role")
    .eq("organization_id", organizationId);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: (r.name as string) ?? "",
    email: r.email as string,
    role: (r.role as string) ?? "",
    orgRole: (r.org_role as OrgRole) ?? "member"
  }));
}

/** Only ever returns 'clinic'-scoped certificates — a member's 'personal'
 * ones are never visible to the org admin, by design (see certLimit/
 * canUseTipsAndLinks below for how scope affects billing on the member's
 * side). This is the only place the manager dashboard (Team.tsx) reads
 * member certificates from, so that privacy boundary is enforced in one
 * spot rather than trusted to every caller. */
export async function listOrgMemberCertificates(memberUserId: string): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_id", memberUserId)
    .eq("scope", "clinic")
    .order("expiry_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapCertRow);
}

/** Pending invites addressed to this email — surfaced to an existing user as
 * an "accept your team invite" prompt (see App.tsx). */
export async function getPendingInvitesForEmail(email: string): Promise<OrgInviteWithOrgName[]> {
  const { data, error } = await supabase
    .from("organization_invites")
    .select("id, email, status, created_at, organization_id, organizations(name)")
    .eq("email", email.trim().toLowerCase())
    .eq("status", "pending");
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    email: r.email as string,
    status: r.status as OrgInvite["status"],
    createdAt: r.created_at as string,
    organizationId: r.organization_id as string,
    organizationName: ((r.organizations as { name?: string } | null)?.name as string) ?? "your team"
  }));
}

export async function acceptOrganizationInvite(
  userId: string,
  invite: { id: string; organizationId: string }
): Promise<void> {
  await updateProfile(userId, { organizationId: invite.organizationId, orgRole: "member" });
  const { error } = await supabase
    .from("organization_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);
  if (error) throw error;
}

// ============================================================
// Pure helpers — plan/date logic, no storage dependency, unchanged
// regardless of where the data lives.
// ============================================================

// A team member's certificates aren't automatically all "covered" just by
// being on a team — only the ones they mark 'clinic' scope are unlimited
// and funded by the clinic's seat. Anything they mark 'personal' still
// counts against their own individual plan (free/plus/pro), same as if they
// weren't on a team at all. certLimit() is that individual-plan number;
// certLimitReached()/canUseTipsAndLinks() are the two places that need to
// know which bucket (clinic vs personal) a given certificate falls into.
export function certLimit(state: AppState): number {
  return PLANS[state.profile.plan].certLimit;
}

/** Whether adding one more certificate of the given scope would be blocked.
 * 'clinic' is never blocked (unlimited, paid for by the org's seat) —
 * only 'personal' certs count against the individual plan's limit, and for
 * a user with no organization at all, everything they add is implicitly
 * 'personal' anyway. */
export function certLimitReached(state: AppState, scope: CertScope = "personal"): boolean {
  if (scope === "clinic") return false;
  const relevantCount = state.profile.organizationId
    ? state.certificates.filter((c) => c.scope === "personal").length
    : state.certificates.length;
  return relevantCount >= certLimit(state);
}

/** 'clinic'-scoped certs always get renewal tips/links (part of what the
 * clinic's seat pays for); 'personal' ones follow the individual's own plan,
 * same as a user with no organization at all. */
export function canUseTipsAndLinks(state: AppState, scope: CertScope = "personal"): boolean {
  if (scope === "clinic") return true;
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
