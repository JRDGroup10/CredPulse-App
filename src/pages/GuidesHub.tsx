import { Link } from "react-router-dom";
import { GUIDE_LIST, GuideVertical } from "../content/guides";
import { useSEO } from "../lib/useSEO";
import Logo from "../components/Logo";

function verticalLabel(vertical: GuideVertical): string {
  switch (vertical) {
    case "healthcare":
      return "🏥 Healthcare";
    case "construction":
      return "🏗️ Construction";
    case "education":
      return "🏫 Education";
    case "policing":
      return "🚓 Policing";
  }
}

// Index page for the content-marketing guides — see content/guides.ts for
// what these are and why they exist. Deliberately plain/neutral styling
// (not brand or amber-themed) since it spans every vertical the product
// serves, same reasoning as the industry chooser being neutral rather than
// picking a side.
export default function GuidesHub({
  onGetStarted,
  onLogin
}: {
  onGetStarted: () => void;
  onLogin: () => void;
}) {
  useSEO({
    title: "Certification & Compliance Guides — CredPulse",
    description:
      "Practical guides on certification renewal — BLS, Working at Heights, vulnerable sector checks, use-of-force recertification, and more. From the team behind CredPulse.",
    path: "/guides"
  });

  return (
    <div className="bg-surface min-h-screen">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/guides">
            <Logo markClassName="w-8 h-8" textClassName="text-base" themeAware={false} />
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Log in
            </button>
            <button
              onClick={onGetStarted}
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all hover:-translate-y-0.5"
            >
              Get started free
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-14 pb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Guides</h1>
        <p className="mt-4 text-slate-500 max-w-xl mx-auto">
          Practical answers to the renewal questions that come up across every industry CredPulse tracks
          certifications for.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid sm:grid-cols-2 gap-5">
          {GUIDE_LIST.map((guide) => (
            <Link
              key={guide.slug}
              to={`/guides/${guide.slug}`}
              className="block border border-slate-200 rounded-2xl p-5 bg-white hover:shadow-card hover:-translate-y-0.5 transition-all"
            >
              <div className="text-[11px] font-semibold text-slate-400 mb-2">{verticalLabel(guide.vertical)}</div>
              <h2 className="font-bold text-slate-900 text-base mb-2">{guide.title}</h2>
              <p className="text-sm text-slate-500 leading-relaxed">{guide.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>

      <footer className="border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <Logo markClassName="w-6 h-6" textClassName="text-sm" themeAware={false} />
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <Link to="/industries" className="hover:text-slate-900">Industries</Link>
              <Link to="/terms" className="hover:text-slate-900">Terms</Link>
              <Link to="/privacy" className="hover:text-slate-900">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
