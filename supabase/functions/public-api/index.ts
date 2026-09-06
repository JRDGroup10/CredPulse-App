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
    .select("id, organization_id, label, revoked_at")
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

  return { organizationId: data.organization_id as string, keyId: data.id as string, keyLabel: data.label as string };
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

async function logApiAudit(
  organizationId: string,
  keyId: string,
  keyLabel: string,
  action: "certificate.created",
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
    return json({ error: "Not found. See the API docs for available routes." }, 404);
  } catch (err) {
    console.error("public-api error:", err);
    return json({ error: "Something went wrong processing that request." }, 500);
  }
});
