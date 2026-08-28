// Supabase Edge Function — notifies the app owner by email whenever a new
// user signs up. Triggered by a Postgres trigger on public.profiles (see
// supabase/notify-signup-trigger.sql), not by the user themselves — deployed
// with --no-verify-jwt for the same reason as send-reminders.
//
// Requires the RESEND_API_KEY secret (already set for reminder emails) and a
// new ADMIN_NOTIFY_EMAIL secret (where these notifications should go).
//
// Deploy with:
//   supabase functions deploy notify-signup --no-verify-jwt
// Set the new secret once with:
//   supabase secrets set ADMIN_NOTIFY_EMAIL=you@example.com

import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_NOTIFY_EMAIL = Deno.env.get("ADMIN_NOTIFY_EMAIL");

const FROM_EMAIL = "CredPulse <notifications@credpulse.app>";

interface SignupPayload {
  name?: string;
  email?: string;
  role?: string;
  region?: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!RESEND_API_KEY || !ADMIN_NOTIFY_EMAIL) {
    console.error("notify-signup: missing RESEND_API_KEY or ADMIN_NOTIFY_EMAIL secret");
    return new Response(JSON.stringify({ error: "Not configured." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const body = (await req.json()) as SignupPayload;
    const name = escapeHtml(body.name || "(no name given)");
    const email = escapeHtml(body.email || "(no email)");
    const role = escapeHtml(body.role || "(no role given)");
    const region = body.region === "US" ? "United States" : "Canada";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: ADMIN_NOTIFY_EMAIL,
        subject: `New CredPulse signup: ${name}`,
        html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
          <p style="font-weight:700;font-size:16px;color:#0f172a;">New sign-up on CredPulse</p>
          <table style="border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Name</td><td>${name}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Email</td><td>${email}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Role</td><td>${role}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Region</td><td>${region}</td></tr>
          </table>
        </div>`
      })
    });

    if (!res.ok) {
      console.error("Resend error:", await res.text());
      return new Response(JSON.stringify({ error: "Failed to send notification email." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("notify-signup error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
