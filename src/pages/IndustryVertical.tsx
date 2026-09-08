import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setIndustryPref } from "../lib/industryPref";
import { useSEO } from "../lib/useSEO";
import Logo from "../components/Logo";

export type VerticalSlug = "construction" | "education" | "policing";

interface VerticalCert {
  name: string;
  detail: string;
}

interface VerticalFAQ {
  q: string;
  a: string;
}

interface VerticalConfig {
  slug: VerticalSlug;
  icon: string;
  audience: string; // "construction crews", used in a few sentences
  eyebrow: string;
  headline: string;
  subhead: string;
  painPointTitle: string;
  painPointBody: string;
  certs: VerticalCert[];
  dashboardLabel: string;
  dashboardExample: { name: string; status: string; tone: string }[];
  faqs: VerticalFAQ[];
}

// Genuinely distinct content per vertical, not the same template with nouns
// swapped — each page targets a different set of real search terms and a
// different set of real concerns, and each has its own FAQPage structured
// data. See Industries.tsx for the hub page these are linked from, and
// useSEO.ts for why per-page tags matter here specifically.
const VERTICALS: Record<VerticalSlug, VerticalConfig> = {
  construction: {
    slug: "construction",
    icon: "🏗️",
    audience: "construction crews",
    eyebrow: "FOR CONSTRUCTION COMPANIES & CONTRACTORS",
    headline: "Keep every ticket current, not just the ones someone remembers.",
    subhead:
      "Working at Heights, confined space entry, forklift and crane operator tickets — CredPulse tracks every hard-expiry credential your crew needs to legally stay on site, and reminds you with enough lead time to actually book the recert course.",
    painPointTitle: "One expired ticket can shut down a job site",
    painPointBody:
      "A site supervisor who can't produce a current Working at Heights card during a safety audit isn't dealing with a paperwork problem — it's a stop-work order and a liability exposure. Most crews track this on spreadsheets, wall calendars, or whatever the site super remembers, which works fine until that person is on vacation, changes roles, or leaves the company and takes the tracking with them.",
    certs: [
      { name: "Working at Heights / Fall Protection", detail: "Typically valid ~3 years; exact cadence varies by province/state" },
      { name: "Confined Space Entry", detail: "Often required annually depending on jurisdiction and employer policy" },
      { name: "Forklift Operator Certification", detail: "Usually renewed every 3 years, sooner after an incident" },
      { name: "Crane Operator (NCCCO)", detail: "5-year renewal cycle with a recertification exam" },
      { name: "WHMIS / Hazard Communication", detail: "Refresher commonly expected every 1–3 years" },
      { name: "First Aid / CPR", detail: "Standard first aid usually valid 3 years; CPR alone is often just 1" }
    ],
    dashboardLabel: "Example: a construction crew's certifications",
    dashboardExample: [
      { name: "Working at Heights Training", status: "Renew now · 9d left", tone: "bg-amber-50 text-amber-700" },
      { name: "Forklift Operator Certification", status: "Valid · 210d left", tone: "bg-emerald-50 text-emerald-700" },
      { name: "Confined Space Entry Training", status: "Expired · 4d overdue", tone: "bg-red-50 text-red-700" }
    ],
    faqs: [
      {
        q: "How do I track Working at Heights certification for a whole crew?",
        a: "Each worker can upload their own card (CredPulse reads the name, issuer, and expiry from a photo or PDF automatically), or a site admin can add certifications on behalf of the crew. Either way, they all show up on one dashboard grouped by certificate — so you can see at a glance who's covered for Working at Heights and who isn't, instead of checking individual files."
      },
      {
        q: "What happens if a ticket expires while someone is scheduled on a job?",
        a: "CredPulse sends reminders on a schedule you control (commonly 90/30/7 days out) well before the expiry date, so the renewal gets booked before it becomes a scheduling problem. The manager dashboard also flags anyone currently expired or renewing soon, so it's visible before you assign that day's crew."
      },
      {
        q: "Can I export a compliance report for a site audit?",
        a: "Yes — Team plans include a one-click compliance report showing every crew member's certification status, generated fresh at the moment you need it, ready to hand to a safety officer or auditor."
      },
      {
        q: "Does this replace our safety management system?",
        a: "No. CredPulse tracks certification expiry dates and reminds people before they lapse — it isn't incident reporting, hazard assessments, or a full safety management platform. Think of it as the one piece those systems usually leave to a spreadsheet."
      }
    ]
  },
  education: {
    slug: "education",
    icon: "🏫",
    audience: "school boards and education employers",
    eyebrow: "FOR SCHOOL BOARDS & EDUCATION EMPLOYERS",
    headline: "Every staff member, every credential, one dashboard.",
    subhead:
      "Vulnerable sector checks, first aid, food handler certification for cafeteria staff — CredPulse tracks the credentials a school board has to keep current across an entire staff, and flags gaps before a new school year starts, not after.",
    painPointTitle: "A lapsed vulnerable sector check isn't just paperwork",
    painPointBody:
      "School boards manage dozens or hundreds of staff, substitutes, and volunteers, each with their own renewal cadence for background checks and safety training. HR teams often find out something's lapsed only when someone flags it manually — usually right when it matters most, like the start of a new term when hiring and re-onboarding volume spikes.",
    certs: [
      { name: "Vulnerable Sector Check", detail: "Many boards require renewal every 3–5 years depending on policy" },
      { name: "First Aid / CPR", detail: "Standard first aid ~3 years; CPR-only is often annual" },
      { name: "Food Handler Certification", detail: "For cafeteria and food-service staff, cadence varies by region" },
      { name: "Mental Health First Aid", detail: "No hard expiry in most regions, but boards often set their own refresh policy" }
    ],
    dashboardLabel: "Example: a school's staff certifications",
    dashboardExample: [
      { name: "Vulnerable Sector Check", status: "Renew now · 12d left", tone: "bg-amber-50 text-amber-700" },
      { name: "First Aid / CPR", status: "Valid · 145d left", tone: "bg-emerald-50 text-emerald-700" },
      { name: "Food Handler Certification", status: "Expired · 2d overdue", tone: "bg-red-50 text-red-700" }
    ],
    faqs: [
      {
        q: "How do we track vulnerable sector checks across an entire staff?",
        a: "Every staff member's check goes on the shared dashboard with its actual expiry date, grouped by certificate type — so HR can see everyone due for renewal this term at a glance, instead of cross-referencing individual personnel files."
      },
      {
        q: "How does this handle new hires each September?",
        a: "New staff (and substitutes) get invited by email and add their own certifications, or an admin adds them directly. If your board already uses an HRIS to manage staff, CredPulse's API can sync new hires in automatically instead of manual invites — see the API docs in Settings once you're set up."
      },
      {
        q: "Can substitute teachers and volunteers be tracked separately from full-time staff?",
        a: "Yes — every certification is tracked per person regardless of employment type, and the dashboard shows everyone the board is responsible for, full-time or not."
      },
      {
        q: "Is staff certification data kept private from each other?",
        a: "Yes. Team members only ever see their own certifications; only designated admins see the roll-up dashboard across the whole staff."
      }
    ]
  },
  policing: {
    slug: "policing",
    icon: "🚓",
    audience: "police services and public safety agencies",
    eyebrow: "FOR POLICE SERVICES & PUBLIC SAFETY AGENCIES",
    headline: "Requalification tracking that doesn't rely on a wall calendar.",
    subhead:
      "Use-of-force recertification, firearms qualification, crisis intervention training — CredPulse tracks the time-sensitive requalifications an officer needs to stay operationally deployed, with reminders before anything lapses.",
    painPointTitle: "An officer deployed without a current requalification is a real liability",
    painPointBody:
      "Use-of-force and firearms requalifications typically run on a fixed annual (or more frequent) cycle set by provincial or state policing standards, tracked per officer across an entire service. When that tracking lives in a training coordinator's personal spreadsheet, a missed renewal isn't discovered until it's already a problem — during an incident review, an audit, or worse.",
    certs: [
      { name: "Use of Force Recertification", detail: "Often annual, mandated by provincial/state policing standards" },
      { name: "Firearms Qualification", detail: "Typically required 1–2 times per year" },
      { name: "Crisis Intervention Training", detail: "Cadence set by department policy, commonly annual refreshers" },
      { name: "First Aid / CPR", detail: "Standard first aid ~3 years; CPR alone often annual" }
    ],
    dashboardLabel: "Example: a unit's requalification status",
    dashboardExample: [
      { name: "Use of Force Recertification", status: "Renew now · 6d left", tone: "bg-amber-50 text-amber-700" },
      { name: "Firearms Qualification", status: "Valid · 88d left", tone: "bg-emerald-50 text-emerald-700" },
      { name: "Crisis Intervention Training", status: "Expired · 1d overdue", tone: "bg-red-50 text-red-700" }
    ],
    faqs: [
      {
        q: "How often does use-of-force certification need to be renewed?",
        a: "It depends on your service's governing policing standards, but annual recertification is common. CredPulse tracks the actual expiry date on file for each officer rather than assuming a fixed schedule, so it works whatever your service's real cadence is."
      },
      {
        q: "Can a training coordinator see requalification status for a whole unit at a glance?",
        a: "Yes — the manager dashboard groups by certificate type across everyone on the team, so a training coordinator can see exactly who's due for firearms requalification this month without checking individual files."
      },
      {
        q: "Is this data kept confidential and access-controlled?",
        a: "Yes. Only designated admins/owners see the roll-up dashboard across the unit; officers only see their own records. An audit log also tracks who accessed or changed certification data and when."
      },
      {
        q: "Can we generate a report for an accreditation review?",
        a: "Yes — Team plans include a one-click compliance report showing current status for everyone tracked, ready to hand to an accreditation reviewer or command staff."
      }
    ]
  }
};

const ALL_SLUGS: VerticalSlug[] = ["construction", "education", "policing"];

export default function IndustryVertical({
  vertical,
  onGetStarted,
  onLogin
}: {
  vertical: VerticalSlug;
  onGetStarted: () => void;
  onLogin: () => void;
}) {
  const navigate = useNavigate();
  const config = VERTICALS[vertical];

  useSEO({
    title: `CredPulse — Certification Tracking for ${config.audience[0].toUpperCase()}${config.audience.slice(1)}`,
    description: `${config.subhead} Free to start for individuals; team plans include a manager dashboard and compliance reporting.`,
    path: `/industries/${vertical}`
  });

  useEffect(() => {
    setIndustryPref("other");
  }, []);

  const otherVerticals = ALL_SLUGS.filter((s) => s !== vertical).map((s) => VERTICALS[s]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };

  return (
    <div className="bg-surface">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Nav */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/industries">
            <Logo markClassName="w-8 h-8" textClassName="text-base" themeAware={false} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/choose"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-full px-3 py-1.5 transition-colors"
            >
              🏥 Healthcare instead? Switch industries
            </Link>
            <button onClick={onLogin} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Log in
            </button>
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-glow-amber transition-all hover:-translate-y-0.5"
            >
              Get started free
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <nav className="text-xs text-slate-400 flex items-center gap-1.5">
          <Link to="/industries" className="hover:text-slate-600">Industries</Link>
          <span>/</span>
          <span className="text-slate-500">{config.icon} {config.audience[0].toUpperCase()}{config.audience.slice(1)}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-300/30 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute top-10 -right-24 w-[28rem] h-[28rem] bg-orange-400/20 rounded-full blur-3xl animate-float-slower" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-14 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-amber-800 bg-white/70 backdrop-blur border border-amber-200 px-3 py-1.5 rounded-full mb-5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {config.eyebrow}
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            {config.headline}
          </h1>
          <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto">{config.subhead}</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-medium px-6 py-3 rounded-lg text-sm shadow-glow-amber transition-all hover:-translate-y-0.5"
            >
              Get started — it's free
            </button>
            <button
              onClick={() => navigate("/signup/clinic")}
              className="text-sm font-medium text-slate-600 px-6 py-3 hover:text-slate-900 transition-colors"
            >
              Set up your team instead →
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-400">No credit card required for the free plan.</p>
        </div>
      </section>

      {/* Pain point */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">{config.painPointTitle}</h2>
          <p className="text-slate-600 leading-relaxed">{config.painPointBody}</p>
        </div>
      </section>

      {/* Certs tracked */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">
          Certifications CredPulse tracks for {config.audience}
        </h2>
        <p className="text-slate-500 text-center max-w-xl mx-auto mb-10">
          A starting point, not a limit — add any certification and CredPulse tracks it the same way.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {config.certs.map((cert) => (
            <div key={cert.name} className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="font-semibold text-slate-900 text-sm">{cert.name}</div>
              <div className="text-xs text-slate-500 mt-1">{cert.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard example */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Same product, no compromises</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Upload a photo or PDF and CredPulse identifies what it is, tracks when it expires, and
              reminds everyone with enough lead time to actually renew it. Team plans give a manager
              one dashboard for who's covered and who's overdue.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-600 list-disc list-inside">
              <li>Upload once — AI reads the certificate details automatically</li>
              <li>Reminders on a schedule you control, before it becomes a problem</li>
              <li>One manager dashboard grouped by certificate, not buried in individual files</li>
              <li>A one-click compliance report ready for an audit or review</li>
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-4">
            <div className="text-xs font-medium text-slate-400 mb-3">{config.dashboardLabel}</div>
            <div className="space-y-2.5">
              {config.dashboardExample.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between border border-slate-100 rounded-xl px-3 py-2.5"
                >
                  <span className="text-sm text-slate-700">{row.name}</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${row.tone}`}>{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Common questions</h2>
        <div className="space-y-5">
          {config.faqs.map((faq) => (
            <div key={faq.q} className="border border-slate-200 rounded-xl p-5 bg-white">
              <h3 className="font-semibold text-slate-900 text-sm mb-2">{faq.q}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Ready to stop tracking this on a sticky note?</h2>
          <p className="text-slate-500 mb-8">Free to start. No credit card required for individuals.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-medium px-6 py-3 rounded-lg text-sm shadow-glow-amber transition-all hover:-translate-y-0.5"
            >
              Track my own certifications
            </button>
            <button
              onClick={() => navigate("/signup/clinic")}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-6 py-3 rounded-lg text-sm shadow-sm transition-all hover:-translate-y-0.5"
            >
              Set up my team
            </button>
          </div>
        </div>
      </section>

      {/* Cross-links to other verticals — internal linking within the topic
          cluster, and a real navigation aid for anyone who landed on the
          wrong page. */}
      <section className="border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Other industries</div>
          <div className="flex flex-wrap gap-3">
            {otherVerticals.map((v) => (
              <Link
                key={v.slug}
                to={`/industries/${v.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-amber-700 border border-slate-200 hover:border-amber-300 rounded-full px-3 py-1.5 transition-colors"
              >
                {v.icon} {v.audience[0].toUpperCase()}{v.audience.slice(1)}
              </Link>
            ))}
            <Link
              to="/home"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-amber-700 border border-slate-200 hover:border-amber-300 rounded-full px-3 py-1.5 transition-colors"
            >
              🏥 Healthcare
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <Logo markClassName="w-6 h-6" textClassName="text-sm" themeAware={false} />
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <Link to="/guides" className="hover:text-slate-900">Guides</Link>
              <Link to="/terms" className="hover:text-slate-900">Terms</Link>
              <Link to="/privacy" className="hover:text-slate-900">Privacy</Link>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            CredPulse is a reminder and tracking tool, not a substitute for your own record-keeping.
            You remain solely responsible for renewing your certifications and licenses on time —
            we're not liable for missed, delayed, or undelivered reminders.
          </p>
        </div>
      </footer>
    </div>
  );
}
