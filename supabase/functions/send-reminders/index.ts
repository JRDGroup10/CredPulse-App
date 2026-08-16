// Supabase Edge Function — real renewal reminder emails.
//
// Meant to run on a daily schedule (see supabase/cron.sql). It scans every
// user's certificates, finds any that hit a reminder threshold TODAY exactly
// (so each threshold fires once, the day it's crossed), and sends one
// summary email per user via Resend.
//
// Requires the RESEND_API_KEY secret. SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided automatically by the Supabase
// platform to every Edge Function — you don't need to set those yourself.
//
// Deploy with:
//   supabase functions deploy send-reminders --no-verify-jwt
// (--no-verify-jwt because this is called by a cron job, not a logged-in
// user — see supabase/cron.sql for how the call is authenticated instead.)
// Set the secret once with:
//   supabase secrets set RESEND_API_KEY=re_...

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Swap this for a verified sending domain in Resend before real launch —
// onboarding@resend.dev works out of the box for testing without any domain setup.
const FROM_EMAIL = "CredPulse <onboarding@resend.dev>";

const FREE_PLAN_REMINDER_DAY = 30; // Free plan: one fixed monthly-style reminder

interface CertRow {
  id: string;
  name: string;
  expiry_date: string;
  renewal_url: string | null;
  user_id: string;
}

interface ProfileRow {
  id: string;
  name: string | null;
  email: string;
  plan: "free" | "plus" | "pro";
  reminder_days: number[] | null;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setUTCHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function buildEmailHtml(name: string, dueCerts: CertRow[]): string {
  const rows = dueCerts
    .map((c) => {
      const days = daysUntil(c.expiry_date);
      const status = days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`;
      const link = c.renewal_url
        ? `<a href="${c.renewal_url}" style="color:#1d4ed8;font-weight:600;">Renew now &rarr;</a>`
        : "";
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eef2f7;">
          <div style="font-weight:600;color:#0f172a;">${c.name}</div>
          <div style="font-size:13px;color:${days < 0 ? "#dc2626" : "#b45309"};margin-top:2px;">${status}</div>
          ${link ? `<div style="margin-top:4px;font-size:13px;">${link}</div>` : ""}
        </td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
  <html>
    <body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#eaf4fb;padding:24px;">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px;">
        <div style="font-weight:700;font-size:16px;color:#0f172a;margin-bottom:4px;">CredPulse</div>
        <p style="color:#475569;font-size:14px;">Hi ${name || "there"} — the following certifications need your attention:</p>
        <table style="width:100%;border-collapse:collapse;margin-top:8px;">${rows}</table>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px;">
          You're receiving this because it's on your CredPulse reminder schedule. Manage your
          schedule anytime in Settings.
        </p>
      </div>
    </body>
  </html>`;
}

async function sendEmail(to: string, name: string, dueCerts: CertRow[]) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject:
        dueCerts.length === 1
          ? `Reminder: ${dueCerts[0].name} needs renewal`
          : `Reminder: ${dueCerts.length} certifications need renewal`,
      html: buildEmailHtml(name, dueCerts)
    })
  });
  if (!res.ok) {
    console.error("Resend error for", to, await res.text());
  }
  return res.ok;
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

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, name, email, plan, reminder_days");
  if (profilesError) {
    console.error(profilesError);
    return new Response(JSON.stringify({ error: profilesError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const { data: certs, error: certsError } = await supabase
    .from("certificates")
    .select("id, name, expiry_date, renewal_url, user_id");
  if (certsError) {
    console.error(certsError);
    return new Response(JSON.stringify({ error: certsError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const certsByUser = new Map<string, CertRow[]>();
  for (const cert of certs as CertRow[]) {
    const list = certsByUser.get(cert.user_id) ?? [];
    list.push(cert);
    certsByUser.set(cert.user_id, list);
  }

  let emailsSent = 0;
  let usersChecked = 0;

  for (const profile of profiles as ProfileRow[]) {
    usersChecked++;
    const userCerts = certsByUser.get(profile.id) ?? [];
    if (userCerts.length === 0) continue;

    const thresholds = profile.plan === "free" ? [FREE_PLAN_REMINDER_DAY] : profile.reminder_days ?? [90, 30, 7];

    const dueToday = userCerts.filter((c) => thresholds.includes(daysUntil(c.expiry_date)));
    if (dueToday.length === 0) continue;

    const ok = await sendEmail(profile.email, profile.name ?? "", dueToday);
    if (ok) emailsSent++;
  }

  return new Response(JSON.stringify({ usersChecked, emailsSent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
