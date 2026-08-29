// Supabase Edge Function — starts a real Stripe Checkout session for a
// clinic/team's seat-based plan, with a free trial built in.
//
// Called by the signed-in admin right after createOrganization() (see
// startOrgCheckout in src/lib/store.ts) — either from the dedicated
// ClinicSignup wizard or from the "Create Team" flow in Settings. Requires a
// valid Supabase session (verified automatically by the platform). Looks up
// (or creates) a Stripe customer for the ORGANIZATION (not the individual
// user — a clinic's billing is separate from any personal plan its members
// might also have), creates a Checkout Session for the requested seat tier,
// and returns the URL to redirect the browser to.
//
// Requires these secrets (10 Price IDs — 5 tiers x 2 billing cycles):
//   STRIPE_SECRET_KEY
//   STRIPE_PRICE_STARTER_MONTHLY,    STRIPE_PRICE_STARTER_YEARLY
//   STRIPE_PRICE_TEAM_MONTHLY,       STRIPE_PRICE_TEAM_YEARLY
//   STRIPE_PRICE_CLINIC_MONTHLY,     STRIPE_PRICE_CLINIC_YEARLY
//   STRIPE_PRICE_BUSINESS_MONTHLY,   STRIPE_PRICE_BUSINESS_YEARLY
//   STRIPE_PRICE_ENTERPRISE_MONTHLY, STRIPE_PRICE_ENTERPRISE_YEARLY
// (ten Price IDs from Stripe Dashboard -> Product catalog — see
// src/lib/orgPlans.ts for the seat limits/prices each tier should match)
//
// Deploy with:
//   supabase functions deploy create-org-checkout-session

import Stripe from "npm:stripe@17.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// 7-day trial, matching ORG_TRIAL_DAYS in src/lib/orgPlans.ts. Kept as a
// plain constant here (rather than imported) since Edge Functions are a
// separate Deno runtime from the Vite app and don't share that file.
const ORG_TRIAL_DAYS = 7;

const PRICE_IDS: Record<string, Record<string, string | undefined>> = {
  starter: {
    monthly: Deno.env.get("STRIPE_PRICE_STARTER_MONTHLY"),
    yearly: Deno.env.get("STRIPE_PRICE_STARTER_YEARLY")
  },
  team: {
    monthly: Deno.env.get("STRIPE_PRICE_TEAM_MONTHLY"),
    yearly: Deno.env.get("STRIPE_PRICE_TEAM_YEARLY")
  },
  clinic: {
    monthly: Deno.env.get("STRIPE_PRICE_CLINIC_MONTHLY"),
    yearly: Deno.env.get("STRIPE_PRICE_CLINIC_YEARLY")
  },
  business: {
    monthly: Deno.env.get("STRIPE_PRICE_BUSINESS_MONTHLY"),
    yearly: Deno.env.get("STRIPE_PRICE_BUSINESS_YEARLY")
  },
  enterprise: {
    monthly: Deno.env.get("STRIPE_PRICE_ENTERPRISE_MONTHLY"),
    yearly: Deno.env.get("STRIPE_PRICE_ENTERPRISE_YEARLY")
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "Payments aren't configured on the server yet (missing STRIPE_SECRET_KEY)." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { organizationId, plan, billingCycle, origin } = await req.json();
    const priceId = PRICE_IDS[plan]?.[billingCycle];

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: `No Stripe price configured for ${plan}/${billingCycle}. Check your Edge Function secrets.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!organizationId) {
      return new Response(JSON.stringify({ error: "organizationId is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // RLS on organizations only lets an owner/member of this org read it, so
    // this also doubles as an authorization check — a random signed-in user
    // can't start checkout for someone else's clinic.
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, stripe_customer_id")
      .eq("id", organizationId)
      .maybeSingle();

    if (orgError || !org) {
      return new Response(JSON.stringify({ error: "Organization not found, or you don't have access to it." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-11-20.acacia" });
    const siteUrl = origin || SUPABASE_URL;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: org.stripe_customer_id || undefined,
      customer_email: org.stripe_customer_id ? undefined : user.email,
      client_reference_id: organizationId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: ORG_TRIAL_DAYS,
        metadata: { organization_id: organizationId, org_plan: plan, org_billing_cycle: billingCycle }
      },
      metadata: { organization_id: organizationId, org_plan: plan, org_billing_cycle: billingCycle },
      success_url: `${siteUrl}/team?checkout=success`,
      cancel_url: `${siteUrl}/team?checkout=cancelled`
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("create-org-checkout-session error:", err);
    return new Response(JSON.stringify({ error: "Couldn't start checkout. Try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
