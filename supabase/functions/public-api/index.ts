// Supabase Edge Function — CredPulse's public API. Lets an org's own
// systems (or a partner's, e.g. an HRIS) read and write its certification
// data programmatically, authenticated by a long-lived API key instead of
// a user login.
//
// Authentication is entirely custom (NOT a Supabase session JWT) — the
// caller sends "Authorization: Bearer cp_live_...", which authenticate()
// below hashes and looks up in public.api_keys. Because of that, this
// function runs with the service-role key and manually enforces every
// scoping rule that RLS would normally handle for a logged-in user: every
// query below is filtered to the calling key's own organization_id, and
// there is no route that can read or write another org's data. See
// generateApiKey()/listApiKeys()/revokeApiKey() in src/lib/store.ts for how
// keys are created/managed, and organizations-schema.sql for the table.
//
// Routes (path is whatever comes after /public-api):
//   GET  /public-api/certificates            list this org's clinic-scoped
//                                             certificates, one row per
//                                             member x certificate.
//        ?status=expired|urgent|upcoming|valid   optional filter
//        ?email=someone@example.com               optional filter, one member
//   GET  /public-api/members                 list this org's team members
//   POST /public-api/certificates            create a certificate for a
//                                             member of this org, identified
//                                             by email. Body:
//        { "memberEmail": "...", "name": "...", "issuer": "...",
//          "credentialType": "certification" | "license" | "training",
//          "issuedDate": "YYYY-MM-DD" (optional), "expiryDate": "YYYY-MM-DD" }
//   POST /public-api/employees               HRIS sync, upsert by email —
//                                             invites a new hire if the email
//                                             isn't already a member/invited,
//                                             or updates name/role if they
//                                             already are. Never touches
//                                             org_role/plan/billing. Body:
//        { "email": "...", "name": "..." (optional), "role": "..." (optional) }
//        Point any HRIS's outbound webhook (or a Zapier/Make automation
//        watching for new-hire/role-change events) at this route — no
//        native OAuth partnership with a specific HRIS provider needed.
//
// Every write through this API is also recorded in the org's audit log
// (public.audit_log), attributed to "API: <key label>" rather than a
// person, so an admin reviewing the audit log can tell API-originated
// changes apart from ones made in the app.
//
// Deploy with (note --no-verify-jwt: callers use their own API key, not a
// Supabase session, so there's no Supabase JWT for the platform's default
// check to verify — authenticate() below is the real gate):
//   supabase functions deploy public-api --no-verify-jwt

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Mirrors ORG_PLANS[...].seatLimit in src/lib/orgPlans.ts — duplicated here
// (same tradeoff update-org-plan's PRICE_IDS map makes) since this Deno
// Edge Function can't import from the Vite app's src/lib.
const ORG_SEAT_LIMITS: Record<string, number> = {
  starter: 5,
  team: 10,
  clinic: 25,
  business: 50,
  enterprise: 100
};

const API_CORS_HEADERS = {
  ...corsHeaders,
  // This API is meant to be called from server-to-server integrations, not
  // browser JS on some third-party page — but OPTIONS/GET/POST all still
  // need to be allowed for tools (curl, Postman, a partner's backend) that
  // preflight anyway.
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...API_CORS_HEADERS, "Content-Type": "application/json" }
  });
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface AuthResult {
  organizationId: string;
  keyId: string;
  keyLabel: string;
  // The admin who created this key — used as the invited_by on any invite
  // the /employees sync route creates, since organization_invites.invited_by
  // requires a real user id and an automated sync has no "person" doing it.
  createdBy: string | null;
}

async function authenticate(req: Request): Promise<AuthResult | null> {
  const header = req.headers.get("Authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const presented = match[1].trim();
  if (!presented) return null;

  const hash = await sha256Hex(presented);
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, organization_id, label, created_by, revoked_at")
    .eq("key_hash", hash)
    .maybeSingle();
  if (error || !data || data.revoked_at) return null;

  // Best-effort — never let this block or fail the actual request.
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id as string)
    .then(
      () => {},
      () => {}
    );

  return {
    organizationId: data.organization_id as string,
    keyId: data.id as string,
    keyLabel: data.label as string,
    createdBy: (data.created_by as string) ?? null
  };
}

// Mirrors statusFor()/daysUntil() in src/lib/store.ts, computed in UTC
// since a server has no meaningful "local timezone" of its own — same
// reasoning as the industry_compliance_benchmarks view using current_date.
function statusFor(dateStr: string): "expired" | "urgent" | "upcoming" | "valid" {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((target - today) / 86400000);
  if (days < 0) return "expired";
  if (days <= 14) return "urgent";
  if (days <= 60) return "upcoming";
  return "valid";
}

type ApiAuditAction = "certificate.created" | "invite.sent" | "member.updated";

async function logApiAudit(
  organizationId: string,
  keyId: string,
  keyLabel: string,
  action: ApiAuditAction,
  opts: { targetType: string; targetId?: string; targetLabel?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  const { error } = await supabase.from("audit_log").insert({
    organization_id: organizationId,
    actor_id: null,
    actor_name: `API: ${keyLabel}`,
    actor_email: null,
    action,
    target_type: opts.targetType,
    target_id: opts.targetId ?? null,
    target_label: opts.targetLabel ?? null,
    metadata: { ...opts.metadata, apiKeyId: keyId }
  });
  if (error) console.error("public-api: failed to write audit log entry (action still succeeded):", error);
}

async function handleListMembers(organizationId: string): Promise<Response> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, org_role")
    .eq("organization_id", organizationId);
  if (error) throw error;
  return json({
    members: (data ?? []).map((r) => ({
      id: r.id,
      name: r.name ?? "",
      email: r.email,
      role: r.role ?? "",
      orgRole: r.org_role ?? "member"
    }))
  });
}

async function handleListCertificates(organizationId: string, params: URLSearchParams): Promise<Response> {
  const { data: members, error: membersError } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("organization_id", organizationId);
  if (membersError) throw membersError;

  const memberById = new Map((members ?? []).map((m) => [m.id as string, m]));
  const memberIds = Array.from(memberById.keys());
  if (memberIds.length === 0) return json({ certificates: [] });

  const { data: certs, error: certsError } = await supabase
    .from("certificates")
    .select("id, user_id, name, issuer, credential_type, issued_date, expiry_date")
    .in("user_id", memberIds)
    .eq("scope", "clinic");
  if (certsError) throw certsError;

  let rows = (certs ?? []).map((c) => {
    const member = memberById.get(c.user_id as string);
    return {
      id: c.id,
      name: c.name,
      issuer: c.issuer,
      credentialType: c.credential_type,
      issuedDate: c.issued_date,
      expiryDate: c.expiry_date,
      status: statusFor(c.expiry_date as string),
      member: member ? { id: member.id, name: member.name ?? "", email: member.email } : null
    };
  });

  const statusFilter = params.get("status");
  if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);

  const emailFilter = params.get("email");
  if (emailFilter) {
    const normalized = emailFilter.trim().toLowerCase();
    rows = rows.filter((r) => r.member?.email?.toLowerCase() === normalized);
  }

  return json({ certificates: rows });
}

async function handleCreateCertificate(auth: AuthResult, body: Record<string, unknown>): Promise<Response> {
  const memberEmail = (body.memberEmail as string | undefined)?.trim().toLowerCase();
  const name = (body.name as string | undefined)?.trim();
  const expiryDate = body.expiryDate as string | undefined;

  if (!memberEmail || !name || !expiryDate) {
    return json({ error: "memberEmail, name, and expiryDate are required." }, 400);
  }

  const { data: member, error: memberError } = await supabase
    .from("profiles")
    .select("id")
    .eq("organization_id", auth.organizationId)
    .eq("email", memberEmail)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!member) {
    return json({ error: `No team member with email ${memberEmail} found in this organization.` }, 404);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("certificates")
    .insert({
      user_id: member.id,
      name,
      issuer: (body.issuer as string | undefined)?.trim() ?? "",
      credential_type: (body.credentialType as string | undefined) ?? "certification",
      issued_date: (body.issuedDate as string | undefined) || null,
      expiry_date: expiryDate,
      scope: "clinic"
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  await logApiAudit(auth.organizationId, auth.keyId, auth.keyLabel, "certificate.created", {
    targetType: "certificate",
    targetId: inserted.id as string,
    targetLabel: name,
    metadata: { expiryDate, memberEmail }
  });

  return json({ id: inserted.id }, 201);
}

/**
 * Upsert-by-email for HRIS sync — designed to be called from any HR system
 * via a native webhook or a Zapier/Make automation, without needing an
 * official native integration with any specific provider. Deliberately
 * never touches org_role, plan, or billing: an automated sync can invite
 * someone or update their job title, never grant admin access.
 */
async function handleSyncEmployee(auth: AuthResult, body: Record<string, unknown>): Promise<Response> {
  const email = (body.email as string | undefined)?.trim().toLowerCase();
  const name = (body.name as string | undefined)?.trim();
  const role = (body.role as string | undefined)?.trim();

  if (!email) {
    return json({ error: "email is required." }, 400);
  }

  const { data: existingMember, error: memberLookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("organization_id", auth.organizationId)
    .eq("email", email)
    .maybeSingle();
  if (memberLookupError) throw memberLookupError;

  if (existingMember) {
    const patch: Record<string, unknown> = {};
    if (name) patch.name = name;
    if (role) patch.role = role;

    if (Object.keys(patch).length === 0) {
      return json({ action: "unchanged", memberId: existingMember.id });
    }

    const { error: updateError } = await supabase.from("profiles").update(patch).eq("id", existingMember.id);
    if (updateError) throw updateError;

    await logApiAudit(auth.organizationId, auth.keyId, auth.keyLabel, "member.updated", {
      targetType: "member",
      targetId: existingMember.id as string,
      targetLabel: email,
      metadata: patch
    });

    return json({ action: "updated", memberId: existingMember.id });
  }

  const { data: existingInvite, error: inviteLookupError } = await supabase
    .from("organization_invites")
    .select("id")
    .eq("organization_id", auth.organizationId)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();
  if (inviteLookupError) throw inviteLookupError;

  if (existingInvite) {
    return json({ action: "already_invited", inviteId: existingInvite.id });
  }

  // Same seat-limit enforcement as the in-app invite flow (see
  // inviteToOrganization in src/lib/store.ts) — a sync shouldn't be able to
  // invite past what the org is actually paying for.
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("plan, name")
    .eq("id", auth.organizationId)
    .maybeSingle();
  if (orgError) throw orgError;

  const seatLimit = ORG_SEAT_LIMITS[(org?.plan as string) ?? "starter"] ?? 5;
  const [membersCountRes, invitesCountRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("organization_id", auth.organizationId),
    supabase
      .from("organization_invites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", auth.organizationId)
      .eq("status", "pending")
  ]);
  if (membersCountRes.error) throw membersCountRes.error;
  if (invitesCountRes.error) throw invitesCountRes.error;
  const seatsUsed = (membersCountRes.count ?? 0) + (invitesCountRes.count ?? 0);

  if (seatsUsed >= seatLimit) {
    return json({ error: `This organization has used all ${seatLimit} seats on its current plan.` }, 409);
  }

  if (!auth.createdBy) {
    // Extremely unlikely (the key's creator's account was deleted), but
    // organization_invites.invited_by is NOT NULL, so there's genuinely
    // nothing valid to insert here.
    return json({ error: "Can't create an invite — this API key's creator's account no longer exists." }, 500);
  }

  const { data: invite, error: insertError } = await supabase
    .from("organization_invites")
    .insert({ organization_id: auth.organizationId, invited_by: auth.createdBy, email })
    .select("id")
    .single();
  if (insertError) throw insertError;

  await logApiAudit(auth.organizationId, auth.keyId, auth.keyLabel, "invite.sent", {
    targetType: "invite",
    targetId: invite.id as string,
    targetLabel: email
  });

  // Best-effort: send the same "you've been invited" email the in-app flow
  // sends — same tradeoff inviteToOrganization makes: a failure here
  // doesn't undo the invite, since the invited person will still see the
  // accept banner on next login regardless.
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-team-invite`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        organizationName: (org?.name as string) ?? "your team",
        inviterName: `${auth.keyLabel} (via API)`
      })
    });
  } catch (err) {
    console.error("public-api: couldn't send invite email (invite was still created):", err);
  }

  return json({ action: "invited", inviteId: invite.id }, 201);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: API_CORS_HEADERS });
  }

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const route = segments[segments.length - 1];

  const auth = await authenticate(req);
  if (!auth) {
    return json({ error: "Invalid, missing, or revoked API key." }, 401);
  }

  try {
    if (route === "members" && req.method === "GET") {
      return await handleListMembers(auth.organizationId);
    }
    if (route === "certificates" && req.method === "GET") {
      return await handleListCertificates(auth.organizationId, url.searchParams);
    }
    if (route === "certificates" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      return await handleCreateCertificate(auth, body);
    }
    if (route === "employees" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      return await handleSyncEmployee(auth, body);
    }
    return json({ error: "Not found. See the API docs for available routes." }, 404);
  } catch (err) {
    console.error("public-api error:", err);
    return json({ error: "Something went wrong processing that request." }, 500);
  }
});
