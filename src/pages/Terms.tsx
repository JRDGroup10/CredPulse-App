import LegalPage, { Section } from "../components/LegalPage";

const SUPPORT_EMAIL = "support@credpulse.app"; // TODO: replace with your real support address once you have a domain

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="August 10, 2026">
      <p className="text-xs italic text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2">
        This is a template, not legal advice. Have a lawyer licensed in your province/state review
        this before you open CredPulse to the public — especially the liability and health-data
        sections, since requirements differ by jurisdiction (e.g. PHIPA in Ontario, HIPAA-adjacent
        rules in the US if you ever handle protected health information).
      </p>

      <Section title="1. What CredPulse is">
        <p>
          CredPulse is a certification and credential tracking tool for healthcare and allied health
          workers. You upload information about your certifications, licenses, and training records,
          and CredPulse stores them and reminds you before they expire. CredPulse is a convenience and
          organizational tool only.
        </p>
      </Section>

      <Section title="2. Not a substitute for your own records">
        <p>
          You are solely responsible for knowing, tracking, and renewing your own certifications,
          licenses, and training on time, in accordance with your employer's and regulatory college's
          requirements. CredPulse does not verify, certify, or guarantee the accuracy of any
          certification you upload, and does not guarantee that any reminder will be delivered or
          delivered on time. CredPulse is not liable for any consequence of a missed, delayed, or
          undelivered reminder, including but not limited to loss of employment, licensure action, or
          financial loss.
        </p>
      </Section>

      <Section title="3. Your account">
        <p>
          You must provide accurate information when creating an account and are responsible for
          keeping your login credentials secure. You must be at least 18 years old to use CredPulse.
          You're responsible for all activity under your account.
        </p>
      </Section>

      <Section title="4. Content you upload">
        <p>
          You retain ownership of any files, images, or documents you upload. By uploading a file, you
          grant CredPulse a limited license to store, process, and display that file back to you, and
          — if you use automatic extraction — to send it to a third-party AI provider solely to
          identify the certification details on it (see Privacy Policy). Don't upload anything you
          don't have the right to upload, or anything containing another person's private information
          without their consent.
        </p>
      </Section>

      <Section title="5. Subscriptions and billing">
        <p>
          Paid plans (Plus, Pro) renew automatically on the billing cycle you select (monthly or
          yearly) until you cancel. You can cancel anytime from the Billing page; you'll keep paid
          features until the end of the current billing period. Prices are shown in USD unless stated
          otherwise and may change with notice. Payments are processed by Stripe — CredPulse never
          stores your full card number.
        </p>
      </Section>

      <Section title="6. Acceptable use">
        <p>
          Don't use CredPulse to store or transmit unlawful content, attempt to access another user's
          data, reverse-engineer or scrape the service, or interfere with its normal operation.
        </p>
      </Section>

      <Section title="7. Termination">
        <p>
          You may delete your account at any time from Settings, which deletes your profile,
          certificates, and uploaded files. We may suspend or terminate accounts that violate these
          terms.
        </p>
      </Section>

      <Section title="8. Disclaimer of warranties & limitation of liability">
        <p>
          CredPulse is provided "as is" without warranties of any kind, express or implied, including
          fitness for a particular purpose. To the maximum extent permitted by law, CredPulse and its
          operators are not liable for indirect, incidental, or consequential damages arising from
          your use of the service, including missed certification renewals.
        </p>
      </Section>

      <Section title="9. Changes to these terms">
        <p>We may update these terms from time to time. Continued use after a change means you accept the updated terms.</p>
      </Section>

      <Section title="10. Contact">
        <p>
          Questions about these terms? Reach us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-600 dark:text-brand-400 font-medium">
            {SUPPORT_EMAIL}
          </a>.
        </p>
      </Section>
    </LegalPage>
  );
}
