import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setIndustryPref } from "../lib/industryPref";
import { useSEO } from "../lib/useSEO";
import Logo from "../components/Logo";

// Same backend as the healthcare product (see Landing.tsx) — organizations,
// seats, certificate tracking, reminders, and AI extraction don't know or
// care what industry a org is in. This page just speaks to a different
// audience and routes into the exact same signup flows: onGetStarted for
// individual signup, /signup/clinic for a team/organization.
const INDUSTRIES = [
  {
    slug: "construction",
    icon: "🏗️",
    title: "Construction",
    body: "Working at Heights, confined space entry, forklift and crane operator certifications — the ones that keep a crew legally allowed on site.",
    examples: ["Working at Heights / Fall Protection", "Confined Space Entry", "Forklift Operator", "Crane Operator (NCCCO)"]
  },
  {
    slug: "education",
    icon: "🏫",
    title: "School boards & education",
    body: "Vulnerable sector checks, first aid, food handler certifications for cafeteria staff — every credential a school board has to keep current across a whole staff.",
    examples: ["Vulnerable Sector Check", "First Aid / CPR", "Food Handler Certification", "Mental Health First Aid"]
  },
  {
    slug: "policing",
    icon: "🚓",
    title: "Policing & public safety",
    body: "Use-of-force recertification, firearms qualification, crisis intervention training — time-sensitive requalifications that can't quietly lapse.",
    examples: ["Use of Force Recertification", "Firearms Qualification", "Crisis Intervention Training", "First Aid / CPR"]
  }
];

export default function Industries({
  onGetStarted,
  onLogin
}: {
  onGetStarted: () => void;
  onLogin: () => void;
}) {
  const navigate = useNavigate();

  // Its own title/description/canonical, not index.html's healthcare-
  // focused defaults — this page's whole audience is construction/
  // education/policing teams, and Google needs to see it as a distinct
  // page, not a duplicate of the homepage. See lib/useSEO.ts.
  useSEO({
    title: "CredPulse — Certification & Compliance Tracking for Construction, Schools & Public Safety",
    description:
      "Track Working at Heights, vulnerable sector checks, use-of-force recertification, and every other hard-expiry credential your crew needs — with reminders before anything lapses. Built for construction, education, and public safety teams across Canada and the US.",
    path: "/industries"
  });

  // Landing here (via the chooser, a direct link, or a bookmark) means this
  // visitor isn't a healthcare one — remember it so their next visit to "/"
  // skips the chooser. See lib/industryPref.ts.
  useEffect(() => {
    setIndustryPref("other");
  }, []);

  return (
    // data-industry="other" retints every brand-* token on this page to
    // amber (see index.css) — the same mechanism the authenticated app uses
    // for "other"-industry accounts, applied here to this standalone
    // pre-login page so it gets the identical amber accent without any
    // hardcoded amber-600/orange-500 classes to keep in sync by hand.
    <div data-industry="other" className="bg-canvas">
      {/* Nav — same floating frosted panel as Landing.tsx/Layout.tsx, so the
          "other industries" side of the site still feels like one product. */}
      <header className="sticky top-4 z-20 px-3">
        <div className="max-w-5xl mx-auto rounded-[19px] border border-hairline/70 dark:border-hairline/10 bg-panel/80 backdrop-blur-md shadow-subtle">
          <div className="px-4 py-3 flex items-center justify-between">
            <Logo markClassName="w-8 h-8" textClassName="text-base" />
            <div className="flex items-center gap-3">
              <Link
                to="/choose"
                className="hidden sm:inline-flex items-center gap-1.5 text-caption font-normal text-ink-muted hover:text-ink border border-hairline hover:border-ink/20 dark:border-hairline/15 rounded-pill px-3 py-1.5 transition-colors"
              >
                🏥 Healthcare instead? Switch industries
              </Link>
              <button onClick={onLogin} className="text-caption font-normal text-ink-muted hover:text-ink transition-colors">
                Log in
              </button>
              <button onClick={onGetStarted} className="btn-primary text-caption px-4 py-2">
                Get started free
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] bg-brand-500/15 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-20 text-center">
          <span className="inline-flex items-center gap-1.5 text-caption font-normal tracking-wide text-brand-400 bg-panel/60 backdrop-blur border border-hairline dark:border-hairline/10 px-3 py-1.5 rounded-pill mb-5 animate-fade-in-up">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            FOR ANY JOB THAT REQUIRES A CERTIFICATION TO STAY ELIGIBLE TO WORK
          </span>
          <h1 className="text-4xl sm:text-6xl font-medium text-ink tracking-tight leading-[1.05] animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            Certification tracking<br className="hidden sm:block" /> for any regulated workplace.
          </h1>
          <p className="mt-6 text-lg text-ink-muted max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "160ms" }}>
            CredPulse started in healthcare, but the problem it solves — a required certification quietly
            expiring because nobody was tracking it — isn't unique to healthcare. Construction crews,
            school boards, and police services all run on the same hard-expiry credentials. It's the
            same product, the same tracking and reminders, just for your team.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
            <button onClick={onGetStarted} className="btn-primary text-body px-6 py-3">
              Get started — it's free
            </button>
            <button
              onClick={() => navigate("/signup/clinic")}
              className="text-body font-normal text-ink-muted px-6 py-3 hover:text-ink transition-colors"
            >
              Set up your team instead →
            </button>
          </div>
          <p className="mt-4 text-caption text-ink-faint animate-fade-in-up" style={{ animationDelay: "280ms" }}>
            No credit card required for the free plan. Don't see your industry below? It still works —
            add any certification and CredPulse will track it.
          </p>
        </div>
      </section>

      {/* Industries */}
      <section className="bg-panel/40 border-y border-hairline/70 dark:border-hairline/10">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-heading-sm sm:text-heading font-medium text-ink text-center mb-3">Built to track credentials like these</h2>
          <p className="text-ink-muted text-center max-w-xl mx-auto mb-10">
            A starting point, not a limit — anyone on any team can add their own certifications on top of these.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {INDUSTRIES.map((ind) => (
              <Link
                key={ind.title}
                to={`/industries/${ind.slug}`}
                className="card p-6 block hover:border-brand-500/30 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-ui bg-brand-500/10 flex items-center justify-center text-2xl mb-4">
                  {ind.icon}
                </div>
                <h3 className="text-subheading font-medium text-ink mb-2">{ind.title}</h3>
                <p className="text-caption text-ink-muted leading-relaxed mb-4">{ind.body}</p>
                <ul className="space-y-1.5 text-caption text-ink-muted mb-4">
                  {ind.examples.map((ex) => (
                    <li key={ex} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-brand-500 flex-shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
                <span className="text-caption font-medium text-brand-400">See details for {ind.title.split(" ")[0]} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Same backend reassurance */}
      <section className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-heading-sm font-medium text-ink">Same product, no compromises</h2>
          <p className="mt-4 text-ink-muted leading-relaxed">
            Upload a photo or PDF of a certificate and CredPulse identifies what it is, tracks when it
            expires, and reminds everyone with enough lead time to actually renew it. Team plans give a
            manager one dashboard for who's covered and who's overdue. None of that changes based on
            what industry you're in.
          </p>
          <ul className="mt-5 space-y-2 text-caption text-ink-muted list-disc list-inside">
            <li>Upload once — AI reads the certificate details automatically</li>
            <li>Reminders on a schedule you control, before it becomes a problem</li>
            <li>One manager dashboard for a whole crew, school, or department</li>
            <li>Everyone keeps their own personal certifications private by default</li>
          </ul>
        </div>
        <div className="card p-4">
          <div className="text-caption font-normal text-ink-faint mb-3">Example: a construction crew's certifications</div>
          <div className="space-y-2.5">
            {[
              { name: "Working at Heights Training", status: "Renew now · 9d left", tone: "bg-amber-500/15 text-amber-500" },
              { name: "Forklift Operator Certification", status: "Valid · 210d left", tone: "bg-emerald-500/15 text-emerald-500" },
              { name: "Confined Space Entry Training", status: "Expired · 4d overdue", tone: "bg-red-500/15 text-red-500" }
            ].map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between border border-hairline/60 dark:border-hairline/10 rounded-ui px-3 py-2.5"
              >
                <span className="text-caption text-ink">{row.name}</span>
                <span className={`badge-pill ${row.tone}`}>{row.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-panel/40 border-t border-hairline/70 dark:border-hairline/10">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="text-heading-sm sm:text-heading font-medium text-ink mb-3">Ready to stop tracking this on a sticky note?</h2>
          <p className="text-ink-muted mb-8">Free to start. No credit card required for individuals.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={onGetStarted} className="btn-primary text-body px-6 py-3">
              Track my own certifications
            </button>
            <button onClick={() => navigate("/signup/clinic")} className="btn-secondary text-body px-6 py-3">
              Set up my team
            </button>
          </div>
          <p className="mt-6 text-caption text-ink-muted">
            Working in healthcare instead?{" "}
            <Link to="/home" className="font-medium text-brand-400">See the healthcare-focused page →</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-hairline/70 dark:border-hairline/10">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <Logo markClassName="w-6 h-6" textClassName="text-sm" />
            <div className="flex items-center gap-4 text-caption font-normal text-ink-muted">
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
