# CredPulse

A certification/credential tracker for healthcare workers — upload a cert, it identifies what it is and when it expires, and reminds you before it lapses. Supports both Canada and the US: users pick their region at sign-up (changeable later in Settings), and certificate names, issuers, and renewal links adjust accordingly — e.g. Heart and Stroke Foundation vs. American Heart Association for BLS/ACLS, or WHMIS vs. OSHA HazCom training.

## Setup

**1. Create a free Supabase project.** Go to [supabase.com](https://supabase.com), sign up, and click "New project." Pick any name and region, set a database password (save it somewhere), and wait ~2 minutes for it to provision.

**2. Run the database schema.** In your new project, open the **SQL Editor** (left sidebar), paste in the entire contents of `supabase/schema.sql` from this repo, and click **Run**. This creates the `profiles` and `certificates` tables, locks them down so users can only ever see their own data (Row Level Security), and sets up a private storage bucket for uploaded certificate files.

**3. Get your API keys.** In your project, go to **Project Settings → API**. You need two values: the **Project URL** and the **anon / public** key (not the `service_role` key — that one's secret and never belongs in frontend code).

**4. Add them to the app.**
```bash
cp .env.example .env.local
```
Open `.env.local` and paste in your Project URL and anon key.

**5. Install and run.**
```bash
npm install
npm run dev
```

**6. (Optional but recommended) Turn off email confirmation for local testing.** By default Supabase requires clicking a confirmation link before you can log in. In your project, go to **Authentication → Providers → Email** and toggle off "Confirm email" while you're testing — turn it back on before real users sign up.

## What's real now

- **Accounts.** Real sign-up/log-in via Supabase Auth (email + password). A profile row is created automatically the moment someone signs up.
- **Data storage.** Certificates and your profile (plan, reminder schedule) live in a real Postgres database, not your browser — usable from any device, survives clearing your browser.
- **File uploads.** Uploaded certificate photos/PDFs are stored in Supabase Storage, private to each user, with a "View file" link that generates a temporary signed URL.
- **Row-level security.** Every table is locked down so a user can only ever read or write their own rows — enforced by the database itself, not just the app's code.

## Real vs. demo-fallback

Every piece below has real, production code already written — it's just gated behind account
setup and API keys only you can provide. **Follow `GO_LIVE.md` for the exact steps.** Until you do,
each one automatically falls back to a working demo simulation, so the app is fully usable either way.

| Piece | Real implementation | Demo fallback (until configured) |
|---|---|---|
| Certificate data extraction | `supabase/functions/extract-certificate` — sends your upload to Claude's vision API, returns structured JSON | `src/lib/mockExtract.ts` — matches known filenames, simulated delay |
| Renewal reminder emails | `supabase/functions/send-reminders` — daily cron job (`supabase/cron.sql`), emails via Resend | Settings still saves your schedule, but nothing sends until this is deployed |
| Subscriptions & payment | `supabase/functions/create-checkout-session` + `stripe-webhook` — real Stripe Checkout & billing portal | `mockCheckout()` in `src/lib/store.ts` — writes the plan straight to your database, no card asked for |
| Hosting | Deploy free on Vercel or Netlify — see `DEPLOYMENT.md` | Your local machine only |

Each real integration is written to fail gracefully — if a secret isn't set or a function isn't
deployed yet, the client automatically falls back to the demo behavior instead of breaking.

## Pricing (`src/lib/plans.ts`)

| | Free | Plus | Pro |
|---|---|---|---|
| Price | $0 | $4.99/mo or $55/yr | $9.45/mo or $105/yr |
| Certificate limit | 2 | 5 | Unlimited |
| Reminders | One monthly summary | Custom 90/30/7-day schedule | Custom 90/30/7-day schedule |
| Renewal tips & direct links | — | ✓ | ✓ |

Change prices, limits, or features in one place — `src/lib/plans.ts` — and both the landing page and in-app Billing page update automatically.

## Payments, AI extraction, reminder emails, and deployment

All four are already built — see **`GO_LIVE.md`** for the exact account-setup and deploy steps for
each, and **`DEPLOYMENT.md`** specifically for hosting. Short version of what's involved:

- **Payments** — Stripe account, 4 prices matching `src/lib/plans.ts`, a few secrets, deploy 3 Edge Functions.
- **AI extraction** — Anthropic API key, one secret, deploy 1 Edge Function.
- **Reminder emails** — Resend account, one secret, deploy 1 Edge Function + one SQL cron job.
- **Deployment** — GitHub + Vercel/Netlify, both free.

## Still on the list

- **PWA install** — add a manifest + service worker (`vite-plugin-pwa`) so it installs to a phone home screen.

## Project structure

```
supabase/
  schema.sql              — run this once in the Supabase SQL Editor
  cron.sql                — schedules the daily reminder email job
  functions/
    extract-certificate/    — real AI extraction (Claude vision)
    send-reminders/           — daily reminder emails (Resend)
    create-checkout-session/    — starts real Stripe Checkout
    create-portal-session/        — opens the Stripe billing portal
    stripe-webhook/                 — the only place plan changes are written after real payment
    _shared/cors.ts                  — shared CORS headers
src/
  lib/
    types.ts           — Certificate, UserProfile, AppState, Plan types
    plans.ts            — pricing/feature config for Free/Plus/Pro
    supabaseClient.ts    — Supabase client, reads .env.local
    store.ts              — all data access: auth, profile, certificates, plan changes, checkout
    mockExtract.ts         — demo extraction + template enrichment (tips/renewal links)
    AppContext.tsx          — session + data loading, wired through the whole app
    ThemeContext.tsx         — dark mode
  components/
    Layout.tsx, CertCard.tsx, StatusBadge.tsx, PricingCards.tsx, LegalPage.tsx
  pages/
    Landing.tsx          — public marketing homepage
    Auth.tsx               — real sign-up / log-in
    Dashboard.tsx            — the main cert list, sorted by urgency, with stats
    AddCertificate.tsx        — upload -> AI extract -> confirm, paywall-gated
    Billing.tsx                 — plan selection, real Stripe checkout + portal
    Settings.tsx                  — profile + reminder schedule
    Terms.tsx, Privacy.tsx          — legal pages
```

## Notes

- Liability language: `Terms.tsx`/`Privacy.tsx` already include a standard disclaimer — the app is a convenience tool, the user remains responsible for their own renewal deadlines — but have a lawyer review both before real users sign up.
- `.env.local` is gitignored — never commit real Supabase or Stripe keys. Server-side secrets (Anthropic, Resend, Stripe) never go in `.env.local` at all — they're set via `supabase secrets set`, see `GO_LIVE.md`.
