// Supabase Edge Function — starts a real Stripe Checkout session for a plan upgrade.
//
// Called by the signed-in user from Billing.tsx. Requires a valid Supabase
// session (verified automatically by the platform). Looks up (or creates) a
// Stripe customer for the user, creates a Checkout Session for the requested
// plan/billing cycle, and returns the URL to redirect the browser to.
//
// Requires these secrets:
//   STRIPE_SECRET_KEY
//   STRIPE_PRICE_PLUS_MONTHLY, STRIPE_PRICE_PLUS_YEARLY
//   STRIPE_PRICE_PRO_MONTHLY,  STRIPE_PRICE_PRO_YEARLY
// (the four Price IDs from Stripe Dashboard -> Product catalog)
//
// Deploy with:
//   supabase functions deploy create-checkout-session
//
// 2026-09-24 fix: profiles.stripe_customer_id did not exist as a column on
// the live database until this deploy (see migration
// add_stripe_customer_id_to_profiles). Because the lookup below silently
// swallowed the resulting query error, this function could never find an
// existing customer and created a brand-new Stripe customer + subscription
// on every single call — which is how at least one user ended up with two
// parallel paid subscriptions billing them every month. Now that the column
// exists this reuse logic works, but we also (a) log any future lookup
// errors instead of silently ignoring them, and (b) explicitly refuse to
// start a second checkout if Stripe already shows a live subscription for
// this customer, as defense in depth against this ever happening again.

import Stripe from "npm:stripe@17.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const PRICE_IDS: Record<string, Record<string, string | undefined>> = {
  plus: {
    monthly: Deno.env.get("STRIPE_PRICE_PLUS_MONTHLY"),
    yearly: Deno.env.get("STRIPE_PRICE_PLUS_YEARLY")
  },
  pro: {
    monthly: Deno.env.get("STRIPE_PRICE_PRO_MONTHLY"),
    yearly: Deno.env.get("STRIPE_PRICE_PRO_YEARLY")
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

    const { plan, billingCycle, origin } = await req.json();
    const priceId = PRICE_IDS[plan]?.[billingCycle];

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: `No Stripe price configured for ${plan}/${billingCycle}. Check your Edge Function secrets.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-11-20.acacia" });

    // Reuse the user's existing Stripe customer if we already have one, so
    // repeat purchases and the billing portal see one consistent history.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      // Don't silently proceed as if this user has no Stripe customer —
      // that's exactly the bug that caused duplicate subscriptions before.
      // Surface it loudly and refuse to guess.
      console.error("create-checkout-session: failed to look up profile for", user.id, profileError);
      return new Response(JSON.stringify({ error: "Couldn't verify your account. Try again in a moment." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const existingCustomerId = profile?.stripe_customer_id || undefined;

    // Defense in depth: even with the lookup above working correctly, refuse
    // to open a second checkout if this customer already has a live
    // subscription in Stripe. Someone re-clicking "Upgrade" after a slow
    // redirect, or hitting this endpoint twice, should never be able to end
    // up paying for two subscriptions at once.
    if (existingCustomerId) {
      const existingSubs = await stripe.subscriptions.list({ customer: existingCustomerId, status: "all", limit: 20 });
      const hasLiveSub = existingSubs.data.some((s) => ["active", "trialing", "past_due"].includes(s.status));
      if (hasLiveSub) {
        return new Response(
          JSON.stringify({
            error: "You already have an active subscription. Manage or change it from the billing portal instead of starting a new checkout."
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const siteUrl = origin || SUPABASE_URL;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: existingCustomerId,
      customer_email: existingCustomerId ? undefined : user.email,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan, billing_cycle: billingCycle }
      },
      metadata: { supabase_user_id: user.id, plan, billing_cycle: billingCycle },
      success_url: `${siteUrl}/billing?checkout=success`,
      cancel_url: `${siteUrl}/billing?checkout=cancelled`
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(JSON.stringify({ error: "Couldn't start checkout. Try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
