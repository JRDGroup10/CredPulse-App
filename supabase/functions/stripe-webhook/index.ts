// Supabase Edge Function — Stripe webhook handler. This is the ONLY place
// that should ever write a user's plan to the database as a result of
// payment — never trust the client to say "I paid," always wait for Stripe
// to confirm it here.
//
// Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET secrets.
//
// Deploy with (note --no-verify-jwt: Stripe calls this, not a logged-in user,
// so there's no Supabase session JWT to verify — the Stripe signature check
// below is what authenticates the request instead):
//   supabase functions deploy stripe-webhook --no-verify-jwt
//
// Then in the Stripe Dashboard -> Developers -> Webhooks -> Add endpoint:
//   URL: https://YOUR-PROJECT-REF.supabase.co/functions/v1/stripe-webhook
//   Events to send: checkout.session.completed, customer.subscription.updated,
//                    customer.subscription.deleted
// Copy the "Signing secret" Stripe shows you and set it as STRIPE_WEBHOOK_SECRET.

import Stripe from "npm:stripe@17.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-11-20.acacia" });
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Reverse-lookup: given a Stripe Price ID, figure out which app plan/cycle it is.
const PRICE_TO_PLAN: Record<string, { plan: "plus" | "pro"; billingCycle: "monthly" | "yearly" }> = {};
const register = (envVar: string, plan: "plus" | "pro", billingCycle: "monthly" | "yearly") => {
  const id = Deno.env.get(envVar);
  if (id) PRICE_TO_PLAN[id] = { plan, billingCycle };
};
register("STRIPE_PRICE_PLUS_MONTHLY", "plus", "monthly");
register("STRIPE_PRICE_PLUS_YEARLY", "plus", "yearly");
register("STRIPE_PRICE_PRO_MONTHLY", "pro", "monthly");
register("STRIPE_PRICE_PRO_YEARLY", "pro", "yearly");

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;
        const billingCycle = session.metadata?.billing_cycle;
        if (userId && plan && billingCycle) {
          await supabase
            .from("profiles")
            .update({
              plan,
              billing_cycle: billingCycle,
              stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id
            })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const priceId = sub.items.data[0]?.price?.id;
        const mapped = priceId ? PRICE_TO_PLAN[priceId] : undefined;

        if (sub.cancel_at_period_end || sub.status === "canceled" || sub.status === "unpaid") {
          // Will actually flip to free on customer.subscription.deleted; nothing to do yet.
          break;
        }
        if (mapped) {
          await supabase
            .from("profiles")
            .update({ plan: mapped.plan, billing_cycle: mapped.billingCycle })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await supabase.from("profiles").update({ plan: "free" }).eq("stripe_customer_id", customerId);
        break;
      }

      default:
        // Ignore anything else.
        break;
    }
  } catch (err) {
    console.error("stripe-webhook handler error:", err);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" }
  });
});
