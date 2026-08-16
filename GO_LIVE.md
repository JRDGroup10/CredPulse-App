# Go-live checklist

Everything below is code I've already built and put in this project. What's left is entirely
account creation and pasting keys into place — things only you can do, since I'm not able to create
accounts or enter API keys/passwords on your behalf. Follow in order; each step lists exactly what
to click and where to paste what you get.

Total cost to go fully live: **$0 to start.** Everything below has a free tier. You'll only pay once
you have real usage (Claude API calls per upload, emails past Resend's free 3,000/month, and Stripe's
standard ~2.9% + 30¢ per transaction once people are actually paying you).

---

## 0. Install the Supabase CLI (needed for steps 2–4)

On your Mac, in Terminal:
```bash
brew install supabase/tap/supabase
```
Then, from inside your `credpulse-app` folder:
```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF
```
(Find your project ref in the Supabase dashboard → Project Settings → General → Reference ID —
it's also the subdomain in your project URL, e.g. `tfktpmvhfolnfnfteaai`.)

---

## 1. Deploy the app live

Follow **DEPLOYMENT.md** — push to GitHub, import into Vercel, add your two `VITE_SUPABASE_*` env
vars there, point Supabase's Auth Site URL at the new domain. ~15 minutes.

## 2. Turn on real AI certificate extraction

1. Create an account at [console.anthropic.com](https://console.anthropic.com) and generate an API key (Settings → API Keys).
2. Set it as a secret:
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```
3. Deploy the function:
   ```bash
   supabase functions deploy extract-certificate
   ```
4. Upload a real certificate photo in the app — it should now come back with AI-read fields instead
   of the demo template match. If it silently falls back to demo mode, open the browser console for
   the warning explaining why.

Cost: a few cents per upload on Claude's pay-as-you-go pricing — check current rates at
[anthropic.com/pricing](https://www.anthropic.com/pricing).

## 3. Turn on real reminder emails

1. Create an account at [resend.com](https://resend.com) (free tier: 3,000 emails/month).
2. Get an API key (API Keys → Create API Key).
3. Set it as a secret:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your-key-here
   ```
4. Deploy the function:
   ```bash
   supabase functions deploy send-reminders --no-verify-jwt
   ```
5. Open `supabase/cron.sql`, fill in your project ref and **service_role** key (Project Settings →
   API), and run the whole file once in the Supabase SQL Editor. This schedules the function to run
   daily.
6. Optional but recommended before real launch: verify your own sending domain in Resend (Domains →
   Add Domain) and update `FROM_EMAIL` in `supabase/functions/send-reminders/index.ts` from the
   `onboarding@resend.dev` test address to your real one, then redeploy.

## 4. Turn on real Stripe payments

1. Create a Stripe account at [stripe.com](https://stripe.com).
2. In the Stripe Dashboard → Product catalog, create **4 prices** matching `src/lib/plans.ts`:
   - Plus — $4.99/month (recurring)
   - Plus — $55/year (recurring)
   - Pro — $9.45/month (recurring)
   - Pro — $105/year (recurring)
   Copy each **Price ID** (starts with `price_...`).
3. Get your **Secret key** (Developers → API keys — use the test key first, switch to live once
   you've tested end-to-end).
4. Set all the secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set STRIPE_PRICE_PLUS_MONTHLY=price_...
   supabase secrets set STRIPE_PRICE_PLUS_YEARLY=price_...
   supabase secrets set STRIPE_PRICE_PRO_MONTHLY=price_...
   supabase secrets set STRIPE_PRICE_PRO_YEARLY=price_...
   ```
5. Deploy the checkout and portal functions:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy create-portal-session
   ```
6. Run the one-line database migration for the new column (safe to re-run — it's included in the
   full `supabase/schema.sql` now too):
   ```sql
   alter table public.profiles add column if not exists stripe_customer_id text;
   ```
7. Set up the webhook: Stripe Dashboard → Developers → Webhooks → **Add endpoint**.
   - URL: `https://YOUR-PROJECT-REF.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Signing secret** it gives you (starts with `whsec_...`) and set it:
     ```bash
     supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
     supabase functions deploy stripe-webhook --no-verify-jwt
     ```
8. Test with a real card in Stripe test mode (card number `4242 4242 4242 4242`, any future date/CVC)
   by clicking Upgrade in the app. Once it works, switch your Stripe keys from test to live and
   re-run steps 4–7 with the live values.

## 5. Legal pages

`/terms` and `/privacy` are already live and linked from the landing page footer, in-app footer, and
signup form. **Have a lawyer review both before real strangers start signing up** — they're a solid
starting template, not a substitute for real legal advice, especially the health-data handling
section (rules like PHIPA/HIPAA vary by where your users are).

Update the placeholder `support@credpulse.app` address in `src/pages/Terms.tsx` and
`src/pages/Privacy.tsx` to your real support email once you have one.

## 6. Last security check

Earlier, your Supabase **service_role** (secret) key was briefly exposed in a client-side env var by
mistake before being fixed. If you haven't already, rotate it now: Project Settings → API → service_role
key → click to regenerate. Nothing depends on the old value once you've updated any place that used it
(none of this project's client code should ever reference it — only the Edge Functions above do, via
the auto-injected `SUPABASE_SERVICE_ROLE_KEY`).

---

## What's still manual/simplified after all of this

- **Refunds/disputes** — handled entirely in the Stripe Dashboard, no in-app UI for it.
- **Plan changes via the Stripe portal** (upgrade/downgrade there instead of in-app) sync back via
  the `customer.subscription.updated` webhook, but only for plans you've mapped a Price ID for.
- **PWA/installable app** — not yet done; ask me if you want a home-screen-installable version.
- **Multi-region data residency disclosure** — the Privacy Policy has a placeholder; fill in your
  actual Supabase project region.
