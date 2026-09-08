import { Link, Navigate, useNavigate } from "react-router-dom";
import { GUIDES, GUIDE_LIST, GuideVertical } from "../content/guides";
import { useSEO } from "../lib/useSEO";
import Logo from "../components/Logo";

// One article page, config-driven from content/guides.ts — see that file for
// why these exist (the third "widen the market" lever, after the SEO
// foundation fix and the per-vertical landing pages) and for the actual
// content. This component is purely presentation: layout, SEO tags,
// structured data, and the CTA back into the product.

function accentClasses(vertical: GuideVertical): { button: string; chip: string; bullet: string } {
  if (vertical === "healthcare") {
    return {
      button: "bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 shadow-glow",
      chip: "text-brand-800 bg-white/70 border-brand-200",
      bullet: "bg-brand-500"
    };
  }
  return {
    button: "bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-600 shadow-glow-amber",
    chip: "text-amber-800 bg-white/70 border-amber-200",
    bullet: "bg-amber-500"
  };
}

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

  const accent = accentClasses(guide.vertical);
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
    <div className="bg-surface min-h-screen">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/guides">
            <Logo markClassName="w-8 h-8" textClassName="text-base" themeAware={false} />
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Log in
            </button>
            <button
              onClick={onGetStarted}
              className={`text-white text-sm font-medium px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5 ${accent.button}`}
            >
              Get started free
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        <nav className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
          <Link to="/guides" className="hover:text-slate-600">Guides</Link>
          <span>/</span>
          <span className="text-slate-500">{verticalLabel(guide.vertical)}</span>
        </nav>
      </div>

      <article className="max-w-3xl mx-auto px-4 pt-6 pb-4">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide backdrop-blur border px-3 py-1.5 rounded-full mb-4 ${accent.chip}`}
        >
          {guide.category}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">{guide.title}</h1>
        <p className="mt-3 text-xs text-slate-400">
          Published {guide.publishedDate}
          {guide.updatedDate !== guide.publishedDate && <> · Updated {guide.updatedDate}</>}
        </p>

        <div className="mt-6 space-y-4 text-slate-600 leading-relaxed">
          {guide.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-8 space-y-8">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold text-slate-900 mb-3">{section.heading}</h2>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                {section.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {section.list && (
                <ul className="mt-3 space-y-1.5">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${accent.bullet}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 border border-slate-200 rounded-2xl p-6 bg-white shadow-card">
          <h2 className="text-lg font-bold text-slate-900 mb-1.5">{guide.ctaHeadline}</h2>
          <p className="text-sm text-slate-600 mb-4">{guide.ctaBody}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onGetStarted}
              className={`text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 ${accent.button}`}
            >
              Get started free
            </button>
            <button
              onClick={() => navigate(verticalHomePath(guide.vertical))}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {guide.ctaLinkLabel} →
            </button>
          </div>
        </div>

        {/* FAQ */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Common questions</h2>
          <div className="space-y-4">
            {guide.faqs.map((faq) => (
              <div key={faq.q} className="border border-slate-200 rounded-xl p-5 bg-white">
                <h3 className="font-semibold text-slate-900 text-sm mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </article>

      {/* More guides */}
      {otherGuides.length > 0 && (
        <section className="border-t border-slate-100 bg-white">
          <div className="max-w-3xl mx-auto px-4 py-10">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">More guides</div>
            <div className="space-y-3">
              {otherGuides.map((g) => (
                <Link
                  key={g.slug}
                  to={`/guides/${g.slug}`}
                  className="block border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:-translate-y-0.5 transition-all"
                >
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">{verticalLabel(g.vertical)}</div>
                  <div className="font-semibold text-slate-900 text-sm">{g.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{g.excerpt}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <Logo markClassName="w-6 h-6" textClassName="text-sm" themeAware={false} />
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <Link to="/industries" className="hover:text-slate-900">Industries</Link>
              <Link to="/terms" className="hover:text-slate-900">Terms</Link>
              <Link to="/privacy" className="hover:text-slate-900">Privacy</Link>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            This guide is general information, not legal or regulatory advice — renewal requirements vary by
            jurisdiction and employer policy. Confirm the specific requirement that applies to you with your
            regulator or employer.
          </p>
        </div>
      </footer>
    </div>
  );
}
