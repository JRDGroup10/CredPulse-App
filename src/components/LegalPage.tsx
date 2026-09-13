import { Link, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useSEO } from "../lib/useSEO";

export default function LegalPage({
  title,
  updated,
  children
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  const { pathname } = useLocation();

  // Shared by Terms and Privacy — without this they'd both silently
  // inherit index.html's homepage title/description/canonical (all three
  // pointing at "/"), which is wrong for two pages that are both listed in
  // sitemap.xml as their own distinct URLs. See lib/useSEO.ts.
  useSEO({
    title: `${title} — CredPulse`,
    description: `${title} for CredPulse, the certification and credential tracking tool for healthcare, construction, education, and public safety teams. Last updated ${updated}.`,
    path: pathname
  });

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-4 z-10 px-3">
        <div className="max-w-3xl mx-auto rounded-[19px] border border-hairline/70 dark:border-hairline/10 bg-panel/80 backdrop-blur-md shadow-subtle">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-ui bg-brand-500 text-white flex items-center justify-center font-medium text-sm">
                CP
              </span>
              <span className="font-medium text-ink">CredPulse</span>
            </Link>
            <div className="flex items-center gap-4 text-caption font-medium">
              <Link to="/terms" className="text-ink-muted hover:text-ink">
                Terms
              </Link>
              <Link to="/privacy" className="text-ink-muted hover:text-ink">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-heading-sm font-medium text-ink mb-1">{title}</h1>
        <p className="text-caption text-ink-faint mb-8">Last updated: {updated}</p>
        <div className="prose-legal space-y-6 text-body text-ink-muted leading-relaxed">
          {children}
        </div>
      </main>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-subheading font-medium text-ink mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
