# Deploying CredPulse

This gets you a real, public URL anyone can sign up at. Takes about 15 minutes, all free tier.

## 1. Push the code to GitHub

If you don't already have a GitHub account, create one at [github.com](https://github.com) (free).

From the `credpulse-app` folder on your Mac, in Terminal:

```bash
cd credpulse-app
git init
git add .
git commit -m "Initial commit"
```

Then on GitHub: click **New repository**, name it `credpulse-app`, leave it empty (no README), click **Create repository**. GitHub will show you commands like this — run them:

```bash
git remote add origin https://github.com/YOUR-USERNAME/credpulse-app.git
git branch -M main
git push -u origin main
```

`.env.local` is already in `.gitignore`, so your Supabase keys won't be pushed — good.

## 2. Deploy to Vercel (recommended)

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account (free).
2. Click **Add New → Project**, select your `credpulse-app` repo, click **Import**.
3. Vercel auto-detects Vite — leave the build settings as-is (`npm run build`, output directory `dist`).
4. Before deploying, add your environment variables (click "Environment Variables"):
   - `VITE_SUPABASE_URL` — same value as in your `.env.local`
   - `VITE_SUPABASE_ANON_KEY` — same value as in your `.env.local`
5. Click **Deploy**. In ~1 minute you'll get a live URL like `credpulse-app.vercel.app`.

A `vercel.json` file is already included so that reloading a page like `/terms` or `/dashboard` works correctly (single-page-app routing).

### Alternative: Netlify

Same idea — [netlify.com](https://netlify.com), "Add new site → Import an existing project," pick your repo, build command `npm run build`, publish directory `dist`, add the same two environment variables under Site settings → Environment variables. A `public/_redirects` file is already included so routing works.

## 3. Point Supabase at your real domain

In your Supabase project: **Authentication → URL Configuration**.

- Set **Site URL** to your live URL (e.g. `https://credpulse-app.vercel.app`, or your custom domain once you add one).
- Add the same URL under **Redirect URLs**.

This matters because the "confirm your email" link Supabase sends points at whatever Site URL is configured — if you skip this, confirmation links will send new users back to `localhost`.

## 4. (Optional) Custom domain

Buy a domain (Namecheap, Google Domains, etc. — a few dollars/year), then in Vercel: **Project → Settings → Domains**, add it, and follow the DNS instructions Vercel gives you. Update the Supabase Site URL/Redirect URLs to match once it's live.

## 5. Turn email confirmation back on

If you turned off "Confirm email" in Supabase for local testing, turn it back on now (**Authentication → Providers → Email**) before real users sign up.

## Every time you push new code

Vercel/Netlify auto-redeploy on every push to `main` — just `git add . && git commit -m "..." && git push` and it goes live in about a minute.
