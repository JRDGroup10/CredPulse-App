// Supabase Edge Function — sends a coworker their "you've been invited"
// email when an org admin invites them from Settings (see inviteToOrganization
// in src/lib/store.ts).
//
// Unlike send-reminders/send-monthly-digest, this is called directly from
// the client while the inviting admin is logged in — NOT from a cron job —
// so it keeps the default JWT verification (no --no-verify-jwt flag) and
// doesn't need the service role key at all; it just sends one email using
// info the client already looked up.
//
// Requires the RESEND_API_KEY secret (same one the other email functions use).
//
// Deploy with:
//   supabase functions deploy send-team-invite

import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "CredPulse <reminders@credpulse.app>";
const APP_URL = "https://credpulse.app";

interface InvitePayload {
  email: string;
  organizationName: string;
  inviterName: string;
}

function buildHtml(payload: InvitePayload): string {
  const joinUrl = `${APP_URL}/join?org=${encodeURIComponent(payload.organizationName)}`;
  return `<!doctype html>
  <html>
    <body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#eaf4fb;padding:24px;">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px;">
        <div style="font-weight:700;font-size:16px;color:#0f172a;margin-bottom:4px;">CredPulse</div>
        <p style="color:#475569;font-size:14px;">
          ${payload.inviterName} has invited you to join <strong>${payload.organizationName}</strong> on
          CredPulse — a simple way to track your certifications and get reminded before they expire.
        </p>
        <a href="${joinUrl}" style="display:inline-block;margin-top:12px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px;">
          Join ${payload.organizationName}
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px;">
          If you already have a CredPulse account, log in with this email address
          (${payload.email}) and you'll see an option to accept the invite.
        </p>
      </div>
    </body>
  </html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  let payload: InvitePayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  if (!payload.email || !payload.organizationName) {
    return new Response(JSON.stringify({ error: "email and organizationName are required." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: payload.email,
      subject: `You've been invited to join ${payload.organizationName} on CredPulse`,
      html: buildHtml(payload)
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error for", payload.email, text);
    return new Response(JSON.stringify({ error: text }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ sent: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
