import { Link, Navigate, useNavigate } from "react-router-dom";
import { GUIDES, GUIDE_LIST, GuideVertical } from "../content/guides";
import { useSEO } from "../lib/useSEO";
import Logo from "../components/Logo";

// One article page, config-driven from content/guides.ts — see that file for
// why these exist (the third "widen the market" lever, after the SEO
// foundation fix and the per-vertical landing pages) and for the actual
// content. This component is purely presentation: layout, SEO tags,
// structured data, and the CTA back into the product.

function verticalHomePath(vertical: GuideVertical): string {
  return vertical === "healthcare" ? "/home" : `/industries/${vertical}`;
}

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

export default function Guide({
  slug,
  onGetStarted,
  onLogin
}: {
  slug: string;
  onGetStarted: () => void;
  onLogin: () => void;
}) {
  const guide = GUIDES[slug];
  const navigate = useNavigate();

  // Hooks must run unconditionally — call useSEO with a safe fallback when
  // the slug doesn't match anything, even though we redirect away right
  // after. An unknown slug shouldn't crash the page, just bounce to the hub.
  useSEO({
    title: guide ? `${guide.title} — CredPulse` : "Guides — CredPulse",
    description: guide?.description ?? "Certification and compliance guides from CredPulse.",
    path: guide ? `/guides/${guide.slug}` : "/guides"
  });

  if (!guide) {
    return <Navigate to="/guides" replace />;
  }

  const otherGuides = GUIDE_LIST.filter((g) => g.slug !== guide.slug).slice(0, 3);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedDate,
    dateModified: guide.updatedDate,
    author: { "@type": "Organization", name: "CredPulse" },
    publisher: { "@type": "Organization", name: "CredPulse" }
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  };

  return (
    // data-industry retints brand-* to amber for non-healthcare guides — same
    // mechanism as Industries.tsx, replacing the old per-vertical accentClasses
    // helper and its hardcoded amber/violet gradient duplication.
    <div data-industry={guide.vertical === "healthcare" ? undefined : "other"} className="bg-canvas min-h-screen">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <header className="sticky top-4 z-20 px-3">
        <div className="max-w-3xl mx-auto rounded-[19px] border border-hairline/70 dark:border-hairline/10 bg-panel/80 backdrop-blur-md shadow-subtle">
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

      <div className="max-w-3xl mx-auto px-4 pt-6">
        <nav className="text-caption text-ink-faint flex items-center gap-1.5 flex-wrap">
          <Link to="/guides" className="hover:text-ink-muted">Guides</Link>
          <span>/</span>
          <span className="text-ink-muted">{verticalLabel(guide.vertical)}</span>
        </nav>
      </div>

      <article className="max-w-3xl mx-auto px-4 pt-6 pb-4">
        <span className="badge-pill bg-panel/60 backdrop-blur border border-hairline dark:border-hairline/10 text-brand-700 dark:text-brand-400 mb-4">
          {guide.category}
        </span>
        <h1 className="text-heading sm:text-heading-lg font-medium text-ink tracking-tight leading-tight">{guide.title}</h1>
        <p className="mt-3 text-caption text-ink-faint">
          Published {guide.publishedDate}
          {guide.updatedDate !== guide.publishedDate && <> · Updated {guide.updatedDate}</>}
        </p>

        <div className="mt-6 space-y-4 text-ink-muted leading-relaxed">
          {guide.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-8 space-y-8">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-subheading font-medium text-ink mb-3">{section.heading}</h2>
              <div className="space-y-3 text-ink-muted leading-relaxed">
                {section.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {section.list && (
                <ul className="mt-3 space-y-1.5">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-caption text-ink-muted">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-brand-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 card p-6">
          <h2 className="text-body font-medium text-ink mb-1.5">{guide.ctaHeadline}</h2>
          <p className="text-caption text-ink-muted mb-4">{guide.ctaBody}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={onGetStarted} className="btn-primary text-caption px-5 py-2.5">
              Get started free
            </button>
            <button
              onClick={() => navigate(verticalHomePath(guide.vertical))}
              className="text-caption font-medium text-ink-muted hover:text-ink transition-colors"
            >
              {guide.ctaLinkLabel} →
            </button>
          </div>
        </div>

        {/* FAQ */}
        <section className="mt-10">
          <h2 className="text-subheading font-medium text-ink mb-4">Common questions</h2>
          <div className="space-y-4">
            {guide.faqs.map((faq) => (
              <div key={faq.q} className="card p-5">
                <h3 className="font-medium text-ink text-body mb-2">{faq.q}</h3>
                <p className="text-caption text-ink-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </article>

      {/* More guides */}
      {otherGuides.length > 0 && (
        <section className="border-t border-hairline/70 dark:border-hairline/10 bg-panel/40">
          <div className="max-w-3xl mx-auto px-4 py-10">
            <div className="text-caption font-medium text-ink-faint uppercase tracking-wide mb-4">More guides</div>
            <div className="space-y-3">
              {otherGuides.map((g) => (
                <Link key={g.slug} to={`/guides/${g.slug}`} className="card p-4 block hover:border-brand-500/30 hover:-translate-y-0.5 transition-all">
                  <div className="text-caption font-medium text-ink-faint mb-1">{verticalLabel(g.vertical)}</div>
                  <div className="font-medium text-ink text-body">{g.title}</div>
                  <div className="text-caption text-ink-muted mt-1">{g.excerpt}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-hairline/70 dark:border-hairline/10">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <Logo markClassName="w-6 h-6" textClassName="text-sm" />
            <div className="flex items-center gap-4 text-caption font-normal text-ink-muted">
              <Link to="/industries" className="hover:text-ink">Industries</Link>
              <Link to="/terms" className="hover:text-ink">Terms</Link>
              <Link to="/privacy" className="hover:text-ink">Privacy</Link>
            </div>
          </div>
          <p className="text-caption text-ink-faint max-w-xl leading-relaxed">
            This guide is general information, not legal or regulatory advice — renewal requirements vary by
            jurisdiction and employer policy. Confirm the specific requirement that applies to you with your
            regulator or employer.
          </p>
        </div>
      </footer>
    </div>
  );
}
