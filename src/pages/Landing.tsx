import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BillingCycle, Plan } from "../lib/types";
import { setIndustryPref } from "../lib/industryPref";
import { useSEO } from "../lib/useSEO";
import PricingCards from "../components/PricingCards";
import MedicalIllustration from "../components/MedicalIllustration";
import Logo from "../components/Logo";
const FEATURES = [
  {
    title: "Upload once, we do the reading",
    body: "Snap a photo or upload a PDF of any certificate. CredPulse identifies what it is, who issued it, and when it expires — no manual data entry.",
    icon: "📄"
  },
  {
    title: "Reminders before it's a problem",
    body: "Get notified well ahead of every deadline, on a schedule you control — not a frantic scramble the week your BLS lapses.",
    icon: "🔔"
  },
  {
    title: "Renewal tips, not just dates",
    body: "Know exactly how to renew each credential — book-ahead warnings, processing times, and a direct link to the right site.",
    icon: "🧭"
  },
  {
    title: "Purpose-built for healthcare credentials across North America",
    body: "From BLS and ACLS to WHMIS and OSHA compliance, vulnerable sector checks and background checks — CredPulse tracks the hard-expiry credentials that keep you eligible to work, wherever you're licensed in Canada or the US.",
    icon: "🇨🇦🇺🇸"
  }
];

const STEPS = [
  { n: "1", title: "Tell us who you are", body: "Your role and a bit of context — takes 30 seconds." },
  { n: "2", title: "Upload your certificates", body: "Photos or PDFs. We extract the details automatically." },
  { n: "3", title: "Relax", body: "We track expiry dates and remind you with time to spare." }
];

export default function Landing({
  onGetStarted,
  onLogin,
  loggedIn = false
}: {
  onGetStarted: () => void;
  onLogin: () => void;
  loggedIn?: boolean;
}) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const navigate = useNavigate();

  // Explicit rather than relying on index.html's defaults, even though they
  // currently match — this is the canonical/authoritative page for these
  // tags, and every other public page (Industries, legal pages) now sets
  // its own via the same hook. See lib/useSEO.ts.
  useSEO({
    title: "CredPulse — Never miss a certification renewal",
    description:
      "CredPulse tracks BLS, ACLS, N95 fit tests, and every other credential healthcare workers need to renew — with reminders before anything lapses. Built for healthcare workers across Canada and the US.",
    path: "/"
  });

  // Landing here (via the chooser, a direct link, or a bookmark) means this
  // visitor is a healthcare one — remember it so their next visit to "/"
  // skips the chooser. See lib/industryPref.ts.
  useEffect(() => {
    setIndustryPref("healthcare");
  }, []);

  // Signed-in visitors land here via the homepage button, not the signup/login
  // flow — clicking a pricing card should take them to billing, not sign-up.
  function handlePricingAction(_plan: Plan) {
    if (loggedIn) {
      navigate("/billing");
    } else {
      onGetStarted();
    }
  }

  return (
    <div className="bg-canvas">
      {/* Nav — same floating frosted panel as the authenticated app's
          Layout.tsx, so the public site and the app feel like one product. */}
      <header className="sticky top-4 z-20 px-3">
        <div className="max-w-5xl mx-auto rounded-[19px] border border-hairline/70 dark:border-hairline/10 bg-panel/80 backdrop-blur-md shadow-subtle">
          <div className="px-4 py-3 flex items-center justify-between">
            <Logo markClassName="w-8 h-8" textClassName="text-base" />
            <div className="flex items-center gap-3">
              <Link
                to="/choose"
                className="hidden sm:inline-flex items-center gap-1.5 text-caption font-normal text-ink-muted hover:text-ink border border-hairline hover:border-ink/20 dark:border-hairline/15 rounded-pill px-3 py-1.5 transition-colors"
              >
                🏗️ Not healthcare? Browse other industries
              </Link>
              {loggedIn ? (
                <Link to="/" className="btn-primary text-caption px-4 py-2">
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <button onClick={onLogin} className="text-caption font-normal text-ink-muted hover:text-ink transition-colors">
                    Log in
                  </button>
                  <button onClick={onGetStarted} className="btn-primary text-caption px-4 py-2">
                    Get started free
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Dimension's "radial spotlight" — a single violet glow rather than
            the old three-color blob cluster, per the source system's "one
            chromatic accent, used sparingly" rule. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] bg-brand-500/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-20 text-center">
          <span className="inline-flex items-center gap-1.5 text-caption font-normal tracking-wide text-brand-400 bg-panel/60 backdrop-blur border border-hairline dark:border-hairline/10 px-3 py-1.5 rounded-pill mb-5 animate-fade-in-up">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            FOR EVERYONE IN HEALTHCARE WITH A CERTIFICATION, LICENSE, OR COURSE TO TRACK
          </span>
          {/* Solid ink text, no text-gradient — Dimension explicitly keeps
              its violet accent out of text fills (glow/wash only), so the
              radial glow above carries the visual interest instead. */}
          <h1 className="text-4xl sm:text-6xl font-medium text-ink tracking-tight leading-[1.05] animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            Never miss a<br className="hidden sm:block" /> certification renewal again.
          </h1>
          <p className="mt-6 text-lg text-ink-muted max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "160ms" }}>
            CredPulse tracks your BLS, ACLS, N95 fit tests, and every other credential you're required
            to keep current — and reminds you with enough time to actually renew, not scramble.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
            {loggedIn ? (
              <Link to="/" className="btn-primary text-body px-6 py-3">
                Go to dashboard
              </Link>
            ) : (
              <button onClick={onGetStarted} className="btn-primary text-body px-6 py-3">
                Get started — it's free
              </button>
            )}
            <a href="#pricing" className="text-body font-normal text-ink-muted px-6 py-3 hover:text-ink transition-colors">
              See pricing
            </a>
          </div>
          {!loggedIn && (
            <p className="mt-4 text-caption text-ink-faint animate-fade-in-up" style={{ animationDelay: "280ms" }}>
              No credit card required for the free plan.
            </p>
          )}

          {/* Product preview mock */}
          <div className="mt-14 max-w-md mx-auto card backdrop-blur p-4 text-left animate-fade-in-up hover:-translate-y-1 transition-transform duration-300" style={{ animationDelay: "340ms" }}>
            <div className="text-caption font-normal text-ink-faint mb-3">Your certifications</div>
            <div className="space-y-2.5">
              {[
                { name: "Basic Life Support (BLS)", status: "Renew now · 5d left", tone: "bg-amber-500/15 text-amber-500" },
                { name: "Advanced Cardiac Life Support (ACLS)", status: "Valid · 120d left", tone: "bg-emerald-500/15 text-emerald-500" },
                { name: "Vulnerable Sector Check", status: "Expired · 10d overdue", tone: "bg-red-500/15 text-red-500" }
              ].map((row, i) => (
                <div
                  key={row.name}
                  style={{ animationDelay: `${420 + i * 90}ms` }}
                  className="animate-fade-in-up flex items-center justify-between border border-hairline/60 dark:border-hairline/10 rounded-ui px-3 py-2.5 hover:border-brand-500/30 hover:bg-brand-500/5 transition-colors"
                >
                  <span className="text-caption text-ink">{row.name}</span>
                  <span className={`badge-pill ${row.tone}`}>{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust signals — every line here is a true, checkable statement
            (see Privacy.tsx / Terms.tsx), never a fabricated stat or badge. */}
        <div className="relative max-w-4xl mx-auto px-4 pb-14">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { icon: "🔒", label: "Data encrypted, never sold" },
              { icon: "🇨🇦🇺🇸", label: "Built for CA & US compliance rules" },
              { icon: "↩️", label: "Cancel anytime, no contract" },
              { icon: "🚫", label: "No spam — only cert reminders" }
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1.5 text-caption font-normal text-ink-muted">
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we do — bg-panel alternates with the canvas sections above/
          below, matching Dimension's documented section rhythm. */}
      <section className="bg-panel/40 border-y border-hairline/70 dark:border-hairline/10">
        <div className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-heading-sm font-medium text-ink">What we do</h2>
            <p className="mt-4 text-ink-muted leading-relaxed">
              Regulatory colleges track your registration renewal. They don't track your BLS card,
              your N95 fit test, your WHMIS training, or your vulnerable sector check — the
              hard-expiry credentials that keep you eligible to actually work a shift. Most people
              track those on a sticky note, a phone reminder, or not at all, and find out they've
              lapsed at the worst possible time.
            </p>
            <p className="mt-4 text-ink-muted leading-relaxed">
              CredPulse is a single place for all of it. Upload each certificate once, and we handle
              the rest: identifying what it is, tracking when it expires, and reminding you early
              enough to actually do something about it.
            </p>
          </div>
          <div className="max-w-xs mx-auto md:max-w-none">
            <MedicalIllustration />
          </div>
        </div>
      </section>

      {/* Built for teams and individuals */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-heading-sm sm:text-heading font-medium text-ink text-center mb-3">Built for how you actually work</h2>
        <p className="text-ink-muted text-center max-w-xl mx-auto mb-10">
          Whether you're tracking your own credentials or responsible for a whole clinic's compliance,
          CredPulse fits the job.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6 hover:border-brand-500/30 hover:-translate-y-1 transition-all duration-300">
            <div className="w-11 h-11 rounded-ui bg-brand-500/10 flex items-center justify-center text-2xl mb-4">
              🏥
            </div>
            <div className="text-caption font-normal tracking-wide text-brand-400 uppercase mb-1">
              For clinics &amp; healthcare teams
            </div>
            <h3 className="text-subheading font-medium text-ink mb-3">One dashboard for your whole staff's compliance</h3>
            <ul className="space-y-2 text-caption text-ink-muted list-disc list-inside">
              <li>Invite your team — clinic-covered certifications roll up into one manager view</li>
              <li>See at a glance who's expired, who's due soon, and who hasn't onboarded yet</li>
              <li>Grouped by certification, so you can answer "who's covered for CPR?" in seconds</li>
              <li>Each staff member keeps their own personal certificates private, unless they choose to share one with the clinic</li>
              <li>Priced per seat, not per certificate — plans from $25/mo for up to 5 people</li>
            </ul>
            <button onClick={() => navigate("/signup/clinic")} className="btn-primary mt-5 w-full sm:w-auto text-caption px-5 py-2.5">
              Set up your clinic
            </button>
          </div>
          <div className="card p-6 hover:border-brand-500/30 hover:-translate-y-1 transition-all duration-300">
            <div className="w-11 h-11 rounded-ui bg-brand-500/10 flex items-center justify-center text-2xl mb-4">
              🧑‍⚕️
            </div>
            <div className="text-caption font-normal tracking-wide text-brand-400 uppercase mb-1">
              For individual healthcare workers
            </div>
            <h3 className="text-subheading font-medium text-ink mb-3">Your own certifications, tracked automatically</h3>
            <ul className="space-y-2 text-caption text-ink-muted list-disc list-inside">
              <li>Upload a photo or PDF — CredPulse reads the details for you</li>
              <li>Reminders sent with enough lead time to actually book a renewal</li>
              <li>A starter checklist of what's typically needed for your specific role</li>
              <li>Upgrade any time to invite coworkers and start a team</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-heading-sm sm:text-heading font-medium text-ink text-center mb-10">How it helps</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{ animationDelay: `${i * 80}ms` }}
              className="group card p-5 hover:border-brand-500/30 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
            >
              <div className="w-11 h-11 rounded-ui bg-brand-500/10 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <div className="font-medium text-ink mb-1.5">{f.title}</div>
              <p className="text-caption text-ink-muted leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-panel/40 border-y border-hairline/70 dark:border-hairline/10">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-heading-sm sm:text-heading font-medium text-ink text-center mb-12">Getting started takes minutes</h2>
          <div className="relative grid sm:grid-cols-3 gap-10 sm:gap-6">
            <div className="hidden sm:block absolute top-[18px] left-[16.5%] right-[16.5%] h-px bg-hairline/70 dark:bg-hairline/10" />
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ animationDelay: `${i * 120}ms` }} className="relative text-center animate-fade-in-up">
                <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center font-medium mx-auto mb-3 relative z-10">
                  {s.n}
                </div>
                <div className="font-medium text-ink mb-1">{s.title}</div>
                <p className="text-caption text-ink-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h2 className="text-heading-sm sm:text-heading font-medium text-ink">Simple pricing</h2>
          <p className="text-ink-muted mt-2">Start free. Upgrade when you need to track more.</p>
          <div className="inline-flex items-center bg-panel border border-hairline/70 dark:border-hairline/10 rounded-pill p-1 mt-5">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-pill text-caption font-normal transition-all ${
                billingCycle === "monthly" ? "bg-canvas text-ink" : "text-ink-faint"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-1.5 rounded-pill text-caption font-normal transition-all ${
                billingCycle === "yearly" ? "bg-canvas text-ink" : "text-ink-faint"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
        <PricingCards billingCycle={billingCycle} onAction={handlePricingAction} />
      </section>

      {/* Footer */}
      <footer className="border-t border-hairline/70 dark:border-hairline/10">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <Logo markClassName="w-6 h-6" textClassName="text-sm" />
            <div className="flex items-center gap-4 text-caption font-normal text-ink-muted">
              <Link to="/industries" className="hover:text-ink">Other industries</Link>
              <Link to="/guides" className="hover:text-ink">Guides</Link>
              <Link to="/terms" className="hover:text-ink">Terms</Link>
              <Link to="/privacy" className="hover:text-ink">Privacy</Link>
            </div>
          </div>
          <p className="text-caption text-ink-faint max-w-xl leading-relaxed">
            CredPulse is a reminder and tracking tool, not a substitute for your own record-keeping.
            You remain solely responsible for renewing your certifications and licenses on time —
            we're not liable for missed, delayed, or undelivered reminders.
          </p>
        </div>
      </footer>
    </div>
  );
}
