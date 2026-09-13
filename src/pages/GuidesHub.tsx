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
    <div className="bg-canvas min-h-screen">
      <header className="sticky top-4 z-20 px-3">
        <div className="max-w-4xl mx-auto rounded-[19px] border border-hairline/70 dark:border-hairline/10 bg-panel/80 backdrop-blur-md shadow-subtle">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link to="/guides">
              <Logo markClassName="w-8 h-8" textClassName="text-base" />
            </Link>
            <div className="flex items-center gap-3">
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

      <div className="max-w-4xl mx-auto px-4 pt-14 pb-8 text-center">
        <h1 className="text-heading sm:text-heading-lg font-medium text-ink tracking-tight">Guides</h1>
        <p className="mt-4 text-ink-muted max-w-xl mx-auto">
          Practical answers to the renewal questions that come up across every industry CredPulse tracks
          certifications for.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid sm:grid-cols-2 gap-5">
          {GUIDE_LIST.map((guide) => (
            <Link key={guide.slug} to={`/guides/${guide.slug}`} className="card p-5 block hover:border-brand-500/30 hover:-translate-y-0.5 transition-all">
              <div className="text-caption font-medium text-ink-faint mb-2">{verticalLabel(guide.vertical)}</div>
              <h2 className="font-medium text-ink text-body mb-2">{guide.title}</h2>
              <p className="text-caption text-ink-muted leading-relaxed">{guide.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>

      <footer className="border-t border-hairline/70 dark:border-hairline/10">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <Logo markClassName="w-6 h-6" textClassName="text-sm" />
            <div className="flex items-center gap-4 text-caption font-normal text-ink-muted">
              <Link to="/industries" className="hover:text-ink">Industries</Link>
              <Link to="/terms" className="hover:text-ink">Terms</Link>
              <Link to="/privacy" className="hover:text-ink">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
