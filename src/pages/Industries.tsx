import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setIndustryPref } from "../lib/industryPref";
import Logo from "../components/Logo";

// Same backend as the healthcare product (see Landing.tsx) — organizations,
// seats, certificate tracking, reminders, and AI extraction don't know or
// care what industry a org is in. This page just speaks to a different
// audience and routes into the exact same signup flows: onGetStarted for
// individual signup, /signup/clinic for a team/organization.
const INDUSTRIES = [
  {
    icon: "🏗️",
    title: "Construction",
    body: "Working at Heights, confined space entry, forklift and crane operator certifications — the ones that keep a crew legally allowed on site.",
    examples: ["Working at Heights / Fall Protection", "Confined Space Entry", "Forklift Operator", "Crane Operator (NCCCO)"]
  },
  {
    icon: "🏫",
    title: "School boards & education",
    body: "Vulnerable sector checks, first aid, food handler certifications for cafeteria staff — every credential a school board has to keep current across a whole staff.",
    examples: ["Vulnerable Sector Check", "First Aid / CPR", "Food Handler Certification", "Mental Health First Aid"]
  },
  {
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

  // Landing here (via the chooser, a direct link, or a bookmark) means this
  // visitor isn't a healthcare one — remember it so their next visit to "/"
  // skips the chooser. See lib/industryPref.ts.
  useEffect(() => {
    setIndustryPref("other");
  }, []);

  return (
    <div className="bg-surface">
      {/* Nav */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo markClassName="w-8 h-8" textClassName="text-base" themeAware={false} />
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
              className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-glow transition-all hover:-translate-y-0.5"
            >
              Get started free
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-300/30 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute top-10 -right-24 w-[28rem] h-[28rem] bg-accent-500/20 rounded-full blur-3xl animate-float-slower" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-14 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-700 bg-white/70 backdrop-blur border border-brand-100 px-3 py-1.5 rounded-full mb-5 shadow-sm animate-fade-in-up">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            FOR ANY JOB THAT REQUIRES A CERTIFICATION TO STAY ELIGIBLE TO WORK
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.05] animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            Certification tracking<br className="hidden sm:block" /> for <span className="text-gradient">any regulated workplace.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "160ms" }}>
            CredPulse started in healthcare, but the problem it solves — a required certification quietly
            expiring because nobody was tracking it — isn't unique to healthcare. Construction crews,
            school boards, and police services all run on the same hard-expiry credentials. It's the
            same product, the same tracking and reminders, just for your team.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-medium px-6 py-3 rounded-lg text-sm shadow-glow transition-all hover:-translate-y-0.5"
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
          <p className="mt-4 text-xs text-slate-400 animate-fade-in-up" style={{ animationDelay: "280ms" }}>
            No credit card required for the free plan. Don't see your industry below? It still works —
            add any certification and CredPulse will track it.
          </p>
        </div>
      </section>

      {/* Industries */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">Built to track credentials like these</h2>
          <p className="text-slate-500 text-center max-w-xl mx-auto mb-10">
            A starting point, not a limit — anyone on any team can add their own certifications on top of these.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {INDUSTRIES.map((ind) => (
              <div
                key={ind.title}
                className="border border-slate-200 rounded-2xl p-6 bg-white hover:shadow-glow hover:border-brand-200 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center text-2xl mb-4">
                  {ind.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{ind.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{ind.body}</p>
                <ul className="space-y-1.5 text-xs text-slate-500">
                  {ind.examples.map((ex) => (
                    <li key={ex} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-brand-400 flex-shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Same backend reassurance */}
      <section className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Same product, no compromises</h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Upload a photo or PDF of a certificate and CredPulse identifies what it is, tracks when it
            expires, and reminds everyone with enough lead time to actually renew it. Team plans give a
            manager one dashboard for who's covered and who's overdue. None of that changes based on
            what industry you're in.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-slate-600 list-disc list-inside">
            <li>Upload once — AI reads the certificate details automatically</li>
            <li>Reminders on a schedule you control, before it becomes a problem</li>
            <li>One manager dashboard for a whole crew, school, or department</li>
            <li>Everyone keeps their own personal certifications private by default</li>
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-4">
          <div className="text-xs font-medium text-slate-400 mb-3">Example: a construction crew's certifications</div>
          <div className="space-y-2.5">
            {[
              { name: "Working at Heights Training", status: "Renew now · 9d left", tone: "bg-amber-50 text-amber-700" },
              { name: "Forklift Operator Certification", status: "Valid · 210d left", tone: "bg-emerald-50 text-emerald-700" },
              { name: "Confined Space Entry Training", status: "Expired · 4d overdue", tone: "bg-red-50 text-red-700" }
            ].map((row) => (
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
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Ready to stop tracking this on a sticky note?</h2>
          <p className="text-slate-500 mb-8">Free to start. No credit card required for individuals.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white font-medium px-6 py-3 rounded-lg text-sm shadow-glow transition-all hover:-translate-y-0.5"
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
          <p className="mt-6 text-sm text-slate-400">
            Working in healthcare instead?{" "}
            <Link to="/home" className="font-medium text-brand-600">See the healthcare-focused page →</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <Logo markClassName="w-6 h-6" textClassName="text-sm" themeAware={false} />
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
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
