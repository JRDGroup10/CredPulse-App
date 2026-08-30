// Supabase Edge Function — changes an EXISTING, already-paying org's seat
// tier by updating the price on its live Stripe subscription in place
// (Stripe prorates automatically), instead of creating a whole new
// checkout session. Used by the "Change plan" picker in TeamSettings.tsx —
// separate from create-org-checkout-session, which is only for a brand-new
// org's first subscription.
//
// Owner/admin only. Requires a valid Supabase session; also re-verifies the
// caller's org_role server-side rather than trusting the client, since
// changing billing is a sensitive action.
//
// Requires the same secrets as create-org-checkout-session:
//   STRIPE_SECRET_KEY
//   STRIPE_PRICE_STARTER_MONTHLY,    STRIPE_PRICE_STARTER_YEARLY
//   STRIPE_PRICE_TEAM_MONTHLY,       STRIPE_PRICE_TEAM_YEARLY
//   STRIPE_PRICE_CLINIC_MONTHLY,     STRIPE_PRICE_CLINIC_YEARLY
//   STRIPE_PRICE_BUSINESS_MONTHLY,   STRIPE_PRICE_BUSINESS_YEARLY
//   STRIPE_PRICE_ENTERPRISE_MONTHLY, STRIPE_PRICE_ENTERPRISE_YEARLY
//
// Deploy with:
//   supabase functions deploy update-org-plan

import Stripe from "npm:stripe@17.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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

    const { organizationId, plan, billingCycle } = await req.json();
    const priceId = PRICE_IDS[plan]?.[billingCycle];

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: `No Stripe price configured for ${plan}/${billingCycle}.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Re-check the caller is actually this org's owner/admin server-side —
    // a plan change is sensitive enough that we don't just trust the client
    // to have hidden the button from non-admins.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, org_role")
      .eq("id", user.id)
      .maybeSingle();

    if (
      profileError ||
      !profile ||
      profile.organization_id !== organizationId ||
      !["owner", "admin"].includes(profile.org_role as string)
    ) {
      return new Response(JSON.stringify({ error: "You don't have permission to change this clinic's plan." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("stripe_subscription_id, subscription_status")
      .eq("id", organizationId)
      .maybeSingle();

    if (orgError || !org) {
      return new Response(JSON.stringify({ error: "Organization not found." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!org.stripe_subscription_id || org.subscription_status === "incomplete") {
      return new Response(
        JSON.stringify({ error: "This clinic hasn't finished its initial billing setup yet — finish that first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-11-20.acacia" });
    const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
    const itemId = subscription.items.data[0]?.id;

    if (!itemId) {
      return new Response(JSON.stringify({ error: "Couldn't find the subscription item to update." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    await stripe.subscriptions.update(org.stripe_subscription_id, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "create_prorations",
      metadata: { organization_id: organizationId, org_plan: plan, org_billing_cycle: billingCycle }
    });

    // Not writing the new plan to the database here on purpose — this
    // function runs as the caller (anon key + their JWT), and RLS only
    // lets the literal owner_id update the organizations row, which would
    // silently no-op for an 'admin' making this same change. The
    // customer.subscription.updated webhook (running as the service role)
    // is the real source of truth and will land within a few seconds
    // regardless of who made the change.
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("update-org-plan error:", err);
    return new Response(JSON.stringify({ error: "Couldn't change the plan. Try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
