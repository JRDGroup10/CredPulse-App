import LegalPage, { Section } from "../components/LegalPage";

const SUPPORT_EMAIL = "support@credpulse.app"; // TODO: replace with your real support address once you have a domain

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="August 10, 2026">
      <p className="text-xs italic text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2">
        This is a template, not legal advice — have it reviewed before real users sign up. If any
        uploaded certificate could count as health information under your jurisdiction's privacy law
        (e.g. PHIPA, PIPEDA, HIPAA), you may have extra obligations beyond what's listed here.
      </p>

      <Section title="1. What we collect">
        <p>We collect:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Account info: name, email, password (hashed by our authentication provider, Supabase — we never see it in plain text), role, and region (Canada/US).</li>
          <li>Certificate data: names, issuers, dates, and any photo/PDF files you upload of your certifications.</li>
          <li>Billing info: your plan and billing cycle. Full payment card details are handled entirely by Stripe and never touch our servers.</li>
          <li>Basic usage data (e.g. login timestamps) for security and troubleshooting.</li>
        </ul>
      </Section>

      <Section title="2. How we use it">
        <p>We use your data to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Show you your own certifications and their expiry status.</li>
          <li>Send you renewal reminder emails on the schedule you choose.</li>
          <li>If you use automatic extraction, send the uploaded file to our AI provider (Anthropic) solely to identify certificate details — the file isn't used to train their models under our agreement.</li>
          <li>Process payments (via Stripe) for paid plans.</li>
          <li>Improve and secure the service.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </Section>

      <Section title="3. Where your data lives">
        <p>
          Your account and certificate data are stored in a managed Postgres database and file storage
          bucket operated by Supabase, protected by row-level security so only you can access your own
          records. Depending on your Supabase project region, data may be stored in the US, Canada, or
          the EU — check your project settings and disclose the actual region here once you deploy.
        </p>
      </Section>

      <Section title="4. Who we share it with">
        <p>We share data only with the service providers needed to run CredPulse:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Supabase</strong> — database, authentication, file storage.</li>
          <li><strong>Anthropic</strong> — only the specific file you upload, only if you use automatic extraction, only to return the extracted fields.</li>
          <li><strong>Resend</strong> (or your chosen email provider) — your email address and reminder content, to deliver reminder emails.</li>
          <li><strong>Stripe</strong> — billing details, if you're on a paid plan.</li>
        </ul>
        <p>We never sell or rent your data to advertisers or data brokers.</p>
      </Section>

      <Section title="5. Your choices">
        <p>
          You can update your profile and region anytime in Settings. You can delete individual
          certificates anytime. You can request full account deletion — including your uploaded files
          — by emailing us; we'll confirm once it's done.
        </p>
      </Section>

      <Section title="6. Security">
        <p>
          Data is encrypted in transit (HTTPS) and at rest by our infrastructure providers.
          Certificate files are stored in a private bucket accessible only via short-lived signed
          URLs generated for your account. No system is 100% secure, and we can't guarantee absolute
          security.
        </p>
      </Section>

      <Section title="7. Children">
        <p>CredPulse is intended for working adults (18+) and isn't directed at children.</p>
      </Section>

      <Section title="8. Changes to this policy">
        <p>We'll update this page if how we handle data changes, and update the "last updated" date above.</p>
      </Section>

      <Section title="9. Contact">
        <p>
          Questions about your data? Reach us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-600 dark:text-brand-400 font-medium">
            {SUPPORT_EMAIL}
          </a>.
        </p>
      </Section>
    </LegalPage>
  );
}
