import { supabase } from "./supabaseClient";
import {
  ApiKey,
  AppState,
  AuditAction,
  AuditLogEntry,
  BillingCycle,
  CertScope,
  Certificate,
  CeuCreditLog,
  MAX_BONUS_CERT_SLOTS,
  OrgInvite,
  OrgInviteWithOrgName,
  OrgMember,
  OrgPlan,
  OrgRole,
  OrgSubscriptionStatus,
  Organization,
  Plan,
  Region,
  ReferralSummary,
  UserProfile
} from "./types";
import { IndustryPref } from "./industryPref";
import { PLANS } from "./plans";
import { ORG_PLANS, nextOrgPlanAbove } from "./orgPlans";
import { Extracted, enrichWithTemplate, mockExtractCertificate } from "./mockExtract";
import { reportError } from "./errorMonitoring";

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
    industry: ((row?.industry as IndustryPref) ?? "healthcare") as IndustryPref,
    referralCode: (row?.referral_code as string) ?? "",
    bonusCertSlots: (row?.bonus_cert_slots as number) ?? 0
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
    scope: ((row.scope as CertScope) ?? "personal") as CertScope,
    ceuRequired: row.ceu_required != null ? Number(row.ceu_required) : undefined
  };
}

function mapCeuCreditLogRow(row: Record<string, unknown>): CeuCreditLog {
  return {
    id: row.id as string,
    certificateId: row.certificate_id as string,
    credits: Number(row.credits),
    activityName: (row.activity_name as string) ?? "",
    completedDate: row.completed_date as string,
    createdAt: row.created_at as string
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
  industry: IndustryPref,
  // Optional — a code captured from a "?ref=<code>" link (see
  // lib/referralCapture.ts). Passed through as signup metadata so
  // handle_new_user() (see supabase/referrals-schema.sql) can link this new
  // account to the referrer and award the referrer their bonus cert slot
  // (the new signup gets no bonus themselves), entirely inside the same
  // trigger that creates the profile row.
  referralCode?: string | null
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role, region, industry, referral_code: referralCode ?? undefined } }
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

/**
 * Whether an error is Postgrest rejecting a request because the JWT's
 * `iat` (issued-at) claim looks like it's in the future relative to the
 * server that received it (Postgrest error code PGRST303, message "JWT
 * issued at future"). This shows up right after a session is established —
 * page load, or right after Supabase's client silently refreshes the
 * access token — and is a transient clock-skew hazard between Supabase's
 * auth service and whichever API node handles the very next request, not a
 * real problem with the token itself: retrying a moment later, once clocks
 * have settled, succeeds. Caught in production via Sentry (see
 * errorMonitoring.ts) — without a retry, this surfaced as the entire app
 * crashing to the ErrorBoundary's "Something went wrong" screen, since
 * useAppState() throws synchronously when state never finished loading.
 */
function isTransientAuthClockSkew(error: unknown): boolean {
  const err = error as { code?: string; message?: string } | null | undefined;
  return err?.code === "PGRST303" || /issued at future/i.test(err?.message ?? "");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loadState(userId: string, fallbackEmail: string): Promise<AppState> {
  // No delay on the first attempt; two short backoffs after that, only for
  // the transient clock-skew error above — any other error still throws
  // immediately on the first try, same as before.
  const backoffs = [0, 500, 1500];
  let lastError: unknown;

  for (const wait of backoffs) {
    if (wait) await delay(wait);

    const [profileRes, certRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("certificates").select("*").eq("user_id", userId).order("expiry_date", { ascending: true })
    ]);

    const error = profileRes.error ?? certRes.error;
    if (!error) {
      return {
        profile: mapProfileRow(profileRes.data, fallbackEmail),
        certificates: (certRes.data ?? []).map(mapCertRow)
      };
    }

    lastError = error;
    if (!isTransientAuthClockSkew(error)) throw error;
    // else: fall through and retry after the next backoff
  }

  throw lastError;
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
  billingCycle: BillingCycle,
  actor?: AuditActor
): Promise<void> {
  const { data, error } = await supabase.functions.invoke("update-org-plan", {
    body: { organizationId, plan, billingCycle }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error as string);

  if (actor) {
    await logAudit(organizationId, actor, "org.plan_changed", {
      targetType: "organization",
      targetId: organizationId,
      targetLabel: `${plan} (${billingCycle})`
    });
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
  file?: File | null,
  // Only needed to write an audit-log entry when this is a clinic-scoped
  // cert — omit it entirely for personal certs, which have no org to log
  // against anyway (logAudit() no-ops without an organizationId).
  auditActor?: AuditActor & { organizationId: string | null }
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
    scope: cert.scope,
    ceu_required: cert.ceuRequired ?? null
  });
  if (error) throw error;

  if (cert.scope === "clinic" && auditActor) {
    await logAudit(auditActor.organizationId, auditActor, "certificate.created", {
      targetType: "certificate",
      targetLabel: cert.name,
      metadata: { expiryDate: cert.expiryDate, credentialType: cert.credentialType }
    });
  }
}

export async function removeCertificate(
  certId: string,
  filePath?: string,
  // Same deal as addCertificate — only pass this for a clinic-scoped cert.
  auditContext?: AuditActor & { organizationId: string | null; certName: string }
): Promise<void> {
  if (filePath) {
    await supabase.storage.from("certificates").remove([filePath]);
  }
  const { error } = await supabase.from("certificates").delete().eq("id", certId);
  if (error) throw error;

  if (auditContext) {
    await logAudit(auditContext.organizationId, auditContext, "certificate.deleted", {
      targetType: "certificate",
      targetId: certId,
      targetLabel: auditContext.certName
    });
  }
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

  // Fetched once, used for both the audit-log entry below and the invite
  // email's "so-and-so invited you" line.
  const inviterProfileRes = await supabase.from("profiles").select("name, email").eq("id", invitedBy).maybeSingle();
  const inviterName = (inviterProfileRes.data?.name as string) || "";
  const inviterEmail = (inviterProfileRes.data?.email as string) || "";

  await logAudit(organizationId, { id: invitedBy, name: inviterName, email: inviterEmail }, "invite.sent", {
    targetType: "invite",
    targetLabel: normalizedEmail
  });

  // Best-effort: let the invited person know by email. If this fails (mail
  // service hiccup, secret not set yet, etc.) the invite row still exists —
  // they'll still auto-join on signup, or see the accept banner on login.
  try {
    await supabase.functions.invoke("send-team-invite", {
      body: {
        email: normalizedEmail,
        organizationName: org?.name ?? "your team",
        inviterName: inviterName || "A CredPulse user"
      }
    });
  } catch (err) {
    console.warn("[CredPulse] Couldn't send invite email (invite was still created):", err);
  }
}

export async function revokeInvite(inviteId: string, actor?: AuditActor): Promise<void> {
  // Fetched first so the audit-log entry below can say which org and which
  // invited email this was, without a second round trip after the update.
  const { data: inviteRow, error: fetchError } = await supabase
    .from("organization_invites")
    .select("organization_id, email")
    .eq("id", inviteId)
    .maybeSingle();
  if (fetchError) throw fetchError;

  const { error } = await supabase.from("organization_invites").update({ status: "revoked" }).eq("id", inviteId);
  if (error) throw error;

  if (actor && inviteRow) {
    await logAudit(inviteRow.organization_id as string, actor, "invite.revoked", {
      targetType: "invite",
      targetLabel: inviteRow.email as string
    });
  }
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
  invite: { id: string; organizationId: string },
  actor?: { name: string; email: string }
): Promise<void> {
  // Must happen before the audit-log insert below — the insert policy
  // checks the accepting user's own profiles.organization_id, which this
  // is what sets it.
  await updateProfile(userId, { organizationId: invite.organizationId, orgRole: "member" });
  const { error } = await supabase
    .from("organization_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);
  if (error) throw error;

  if (actor) {
    await logAudit(invite.organizationId, { id: userId, name: actor.name, email: actor.email }, "invite.accepted", {
      targetType: "invite",
      targetLabel: actor.email
    });
  }
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
  const base = PLANS[state.profile.plan].certLimit;
  // Pro is already unlimited — adding a finite bonus on top of Infinity is a
  // no-op anyway, but this keeps the intent explicit rather than relying on
  // Infinity + n === Infinity.
  if (base === Infinity) return base;
  return base + state.profile.bonusCertSlots;
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

/**
 * Whole calendar days between today and a "YYYY-MM-DD" date string.
 *
 * BUG FIX (caught by the automated test suite, see store.test.ts): the
 * previous version built `target` via `new Date(dateStr)`, which parses a
 * bare date-only string as UTC midnight, then called `.setHours(0,0,0,0)`
 * on it — which re-normalizes to LOCAL midnight of whatever calendar day
 * that UTC instant falls on. For anyone west of UTC (all of Canada and the
 * US — this app's entire market), UTC midnight on a given date is still
 * the *previous* evening in local time, so that re-normalization silently
 * rolled every expiry date back by one day. That made every "Xd left"/
 * overdue count, status badge, and the Team.tsx compliance rollup off by
 * one for effectively every real user. Fixed by building `target` directly
 * from its year/month/day components via the local-time Date constructor,
 * so there's no UTC-parsing detour to go wrong in the first place.
 */
export function daysUntil(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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

// ============================================================
// Audit log — enterprise-readiness feature. See
// supabase/organizations-schema.sql for the table/RLS.
// ============================================================

export interface AuditActor {
  id: string;
  name: string;
  email: string;
}

/**
 * Best-effort: writes one audit-log row for an org-scoped action. Never
 * throws — the real action this is logging (a cert delete, an invite sent,
 * etc.) has already succeeded by the time this runs, and a broken audit
 * write should never roll that back or surface as an error to the person
 * who just did something perfectly valid. It's still reported to Sentry,
 * though, since a silent gap in the audit trail defeats the point of having
 * one — better to know about it than not.
 *
 * No-ops (silently) if there's no organizationId, since only clinic/team
 * actions get audited — an individual user's own data has no "org" to log
 * against.
 */
async function logAudit(
  organizationId: string | null | undefined,
  actor: AuditActor,
  action: AuditAction,
  opts: { targetType?: string; targetId?: string; targetLabel?: string; metadata?: Record<string, unknown> } = {}
): Promise<void> {
  if (!organizationId) return;
  const { error } = await supabase.from("audit_log").insert({
    organization_id: organizationId,
    actor_id: actor.id,
    actor_name: actor.name || null,
    actor_email: actor.email,
    action,
    target_type: opts.targetType ?? null,
    target_id: opts.targetId ?? null,
    target_label: opts.targetLabel ?? null,
    metadata: opts.metadata ?? null
  });
  if (error) {
    reportError(error, { context: "logAudit", action, organizationId });
  }
}

/** Org admins/owners only (enforced by RLS — see organizations-schema.sql),
 * most recent first. Used by the Audit Log page. */
export async function listAuditLog(organizationId: string, limit = 200): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, actor_name, actor_email, action, target_label, metadata, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    actorName: ((r.actor_name as string) || (r.actor_email as string) || "Unknown").trim(),
    action: r.action as AuditAction,
    targetLabel: (r.target_label as string) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? null,
    createdAt: r.created_at as string
  }));
}

/** Plain-language label for an audit action, for the UI. */
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "certificate.created": "Added a certificate",
  "certificate.deleted": "Deleted a certificate",
  "invite.sent": "Invited a teammate",
  "invite.revoked": "Revoked an invite",
  "invite.accepted": "Joined the team",
  "org.plan_changed": "Changed the plan",
  "api_key.created": "Created an API key",
  "api_key.revoked": "Revoked an API key",
  "member.updated": "Updated a team member"
};

// ============================================================
// Public API — enterprise-readiness feature. See
// supabase/organizations-schema.sql for the api_keys table/RLS and
// supabase/functions/public-api for how these keys actually authenticate
// requests.
// ============================================================

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 24 random bytes, base64url-encoded (URL/header-safe, no padding) — the
 * "body" of a new API key, appended to a fixed prefix below. */
function randomKeyBody(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return toHex(digest);
}

export interface GeneratedApiKey {
  key: ApiKey;
  /** The actual, usable key — only ever available here, once, right after
   * creation. Only its SHA-256 hash is stored (see the table comment in
   * organizations-schema.sql), so there's no "reveal it again later"
   * feature anywhere in this app because there's nothing left to reveal. */
  plaintext: string;
}

/**
 * Creates a new API key for an org, scoped by the public-api Edge Function
 * to that org and nothing else. Owner/admin only (enforced by RLS on the
 * insert — see organizations-schema.sql).
 */
export async function generateApiKey(
  organizationId: string,
  createdBy: string,
  label: string,
  actor?: { name: string; email: string }
): Promise<GeneratedApiKey> {
  const plaintext = `cp_live_${randomKeyBody()}`;
  const keyHash = await sha256Hex(plaintext);
  // "cp_live_" (8 chars) + 6 more — enough for an admin to tell two keys
  // apart in a list, nowhere near enough to help guess the rest.
  const keyPrefix = plaintext.slice(0, 14);

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      organization_id: organizationId,
      created_by: createdBy,
      label: label.trim() || "Untitled key",
      key_hash: keyHash,
      key_prefix: keyPrefix
    })
    .select("id, label, key_prefix, created_at, last_used_at, revoked_at")
    .single();
  if (error) throw error;

  const key: ApiKey = {
    id: data.id as string,
    label: data.label as string,
    keyPrefix: data.key_prefix as string,
    createdAt: data.created_at as string,
    lastUsedAt: (data.last_used_at as string) ?? null,
    revokedAt: (data.revoked_at as string) ?? null
  };

  if (actor) {
    await logAudit(organizationId, { id: createdBy, name: actor.name, email: actor.email }, "api_key.created", {
      targetType: "api_key",
      targetId: key.id,
      targetLabel: key.label
    });
  }

  return { key, plaintext };
}

/** Owner/admin only (enforced by RLS — see organizations-schema.sql). Never
 * returns anything that could reconstruct a working key — just metadata. */
export async function listApiKeys(organizationId: string): Promise<ApiKey[]> {
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, label, key_prefix, created_at, last_used_at, revoked_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    label: r.label as string,
    keyPrefix: r.key_prefix as string,
    createdAt: r.created_at as string,
    lastUsedAt: (r.last_used_at as string) ?? null,
    revokedAt: (r.revoked_at as string) ?? null
  }));
}

/** Sets revoked_at rather than deleting the row, so the audit trail (both
 * this app's own audit_log and the key's own created/last-used history)
 * stays intact. public-api checks revoked_at is null before honoring a key,
 * so this takes effect immediately on the next request. */
export async function revokeApiKey(keyId: string, actor?: AuditActor): Promise<void> {
  const { data: keyRow, error: fetchError } = await supabase
    .from("api_keys")
    .select("organization_id, label")
    .eq("id", keyId)
    .maybeSingle();
  if (fetchError) throw fetchError;

  const { error } = await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", keyId);
  if (error) throw error;

  if (actor && keyRow) {
    await logAudit(keyRow.organization_id as string, actor, "api_key.revoked", {
      targetType: "api_key",
      targetId: keyId,
      targetLabel: keyRow.label as string
    });
  }
}

// ============================================================
// Referral / viral loop. See supabase/referrals-schema.sql — the actual
// linking and reward-granting happens entirely inside handle_new_user() at
// signup time; this is just a read for the Settings UI to show what the
// user has earned so far.
// ============================================================

/** referralCode/bonusCertSlots already live on the profile row (loaded via
 * loadState() into AppState), so this only needs one extra query — how many
 * people this user has successfully referred. */
export async function getReferralSummary(state: AppState, userId: string): Promise<ReferralSummary> {
  const { count, error } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", userId);
  if (error) throw error;

  return {
    referralCode: state.profile.referralCode,
    referralCount: count ?? 0,
    bonusCertSlots: state.profile.bonusCertSlots,
    maxBonusCertSlots: MAX_BONUS_CERT_SLOTS
  };
}

// ============================================================
// CE-credit tracking (see supabase/ceu-tracking-schema.sql). Deepen-the-
// product feature: some certifications (CPC, CRCST, PANCE — see the content
// guides for these) renew by accumulating a required number of continuing-
// education credits across the cycle rather than via a single course/exam.
// CeuTracker.tsx is the UI; these are the reads/writes it calls.
// ============================================================

/** Sets or changes a certificate's CEU requirement. Passing null turns off
 * CEU tracking for this certificate (CeuTracker.tsx stops showing for it) —
 * it does NOT delete any already-logged credits, so re-enabling it later
 * picks up right where the logged history left off. */
export async function updateCertificateCeuRequirement(certificateId: string, ceuRequired: number | null): Promise<void> {
  const { error } = await supabase.from("certificates").update({ ceu_required: ceuRequired }).eq("id", certificateId);
  if (error) throw error;
}

export async function listCeuCredits(certificateId: string): Promise<CeuCreditLog[]> {
  const { data, error } = await supabase
    .from("ceu_credit_logs")
    .select("id, certificate_id, credits, activity_name, completed_date, created_at")
    .eq("certificate_id", certificateId)
    .order("completed_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapCeuCreditLogRow);
}

export async function addCeuCredit(
  certificateId: string,
  userId: string,
  entry: { credits: number; activityName: string; completedDate: string }
): Promise<void> {
  const { error } = await supabase.from("ceu_credit_logs").insert({
    certificate_id: certificateId,
    user_id: userId,
    credits: entry.credits,
    activity_name: entry.activityName || null,
    completed_date: entry.completedDate
  });
  if (error) throw error;
}

export async function deleteCeuCredit(id: string): Promise<void> {
  const { error } = await supabase.from("ceu_credit_logs").delete().eq("id", id);
  if (error) throw error;
}

/** Pure helper — total credits earned across a set of logs. Kept separate
 * from the fetch so it's independently testable without a Supabase client. */
export function sumCeuCredits(logs: CeuCreditLog[]): number {
  return logs.reduce((sum, l) => sum + l.credits, 0);
}
