// Supabase Edge Function — monthly compliance digest email.
//
// Unlike send-reminders (which only emails when a certificate crosses a
// specific reminder threshold), this sends EVERY user a summary once a
// month regardless of whether anything is due — a standing retention
// touchpoint so CredPulse stays visible even in a quiet month. Users with
// zero certificates get a "come add your first one" nudge instead of a
// status summary.
//
// Meant to run on a monthly schedule (see supabase/cron-monthly-digest.sql).
// Requires the RESEND_API_KEY secret (same one send-reminders uses).
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by
// the Supabase platform to every Edge Function — you don't need to set
// those yourself.
//
// Deploy with:
//   supabase functions deploy send-monthly-digest --no-verify-jwt
// (--no-verify-jwt because this is called by a cron job, not a logged-in
// user — see supabase/cron-monthly-digest.sql for how the call is
// authenticated instead.)

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const FROM_EMAIL = "CredPulse <reminders@credpulse.app>";
const APP_URL = "https://credpulse.app";

interface CertRow {
  id: string;
  name: string;
  expiry_date: string;
  user_id: string;
}

interface ProfileRow {
  id: string;
  name: string | null;
  email: string;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setUTCHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

// Same thresholds the app's Dashboard uses, so the digest always agrees
// with what a user sees when they click through.
function statusFor(dateStr: string): "expired" | "urgent" | "upcoming" | "valid" {
  const days = daysUntil(dateStr);
  if (days < 0) return "expired";
  if (days <= 14) return "urgent";
  if (days <= 60) return "upcoming";
  return "valid";
}

function buildSummaryEmailHtml(name: string, certs: CertRow[]): { subject: string; html: string } {
  const expired = certs.filter((c) => statusFor(c.expiry_date) === "expired");
  const urgent = certs.filter((c) => statusFor(c.expiry_date) === "urgent");
  const needsAttention = [...expired, ...urgent];
  const allGood = needsAttention.length === 0;

  const subject = allGood
    ? "Your monthly CredPulse summary — you're all set"
    : `Your monthly CredPulse summary — ${needsAttention.length} need${needsAttention.length === 1 ? "s" : ""} attention`;

  const attentionRows = needsAttention
    .sort((a, b) => daysUntil(a.expiry_date) - daysUntil(b.expiry_date))
    .map((c) => {
      const days = daysUntil(c.expiry_date);
      const status = days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`;
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eef2f7;">
          <div style="font-weight:600;color:#0f172a;">${c.name}</div>
          <div style="font-size:13px;color:${days < 0 ? "#dc2626" : "#b45309"};margin-top:2px;">${status}</div>
        </td>
      </tr>`;
    })
    .join("");

  const summaryLine = allGood
    ? `All ${certs.length} of your tracked certification${certs.length === 1 ? " is" : "s are"} in good standing. Nothing to do this month.`
    : `You're tracking ${certs.length} certification${certs.length === 1 ? "" : "s"} — ${needsAttention.length} need${needsAttention.length === 1 ? "s" : ""} your attention.`;

  const html = `<!doctype html>
  <html>
    <body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#eaf4fb;padding:24px;">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px;">
        <div style="font-weight:700;font-size:16px;color:#0f172a;margin-bottom:4px;">CredPulse — Monthly summary</div>
        <p style="color:#475569;font-size:14px;">Hi ${name || "there"} — ${summaryLine}</p>
        ${attentionRows ? `<table style="width:100%;border-collapse:collapse;margin-top:8px;">${attentionRows}</table>` : ""}
        <a href="${APP_URL}" style="display:inline-block;margin-top:20px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px;">
          View your dashboard
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px;">
          You're receiving this monthly summary because you have an active CredPulse account.
        </p>
      </div>
    </body>
  </html>`;

  return { subject, html };
}

function buildNoCertsEmailHtml(name: string): { subject: string; html: string } {
  return {
    subject: "Get started with CredPulse — add your first certification",
    html: `<!doctype html>
    <html>
      <body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#eaf4fb;padding:24px;">
        <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px;">
          <div style="font-weight:700;font-size:16px;color:#0f172a;margin-bottom:4px;">CredPulse</div>
          <p style="color:#475569;font-size:14px;">
            Hi ${name || "there"} — you haven't added a certification yet. Upload one and CredPulse will
            track its expiry and remind you before it lapses, automatically.
          </p>
          <a href="${APP_URL}" style="display:inline-block;margin-top:12px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px;">
            Add your first certificate
          </a>
        </div>
      </body>
    </html>`
  };
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
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

  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id, name, email");
  if (profilesError) {
    console.error(profilesError);
    return new Response(JSON.stringify({ error: profilesError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const { data: certs, error: certsError } = await supabase
    .from("certificates")
    .select("id, name, expiry_date, user_id");
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

    const { subject, html } =
      userCerts.length === 0 ? buildNoCertsEmailHtml(profile.name ?? "") : buildSummaryEmailHtml(profile.name ?? "", userCerts);

    const ok = await sendEmail(profile.email, subject, html);
    if (ok) emailsSent++;
  }

  return new Response(JSON.stringify({ usersChecked, emailsSent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
