import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setIndustryPref, IndustryPref } from "../lib/industryPref";
import { LogoMark } from "../components/Logo";

// The very first thing a fresh, logged-out visitor sees at credpulse.app —
// two equally-weighted panels, since CredPulse is genuinely the same product
// (same tracking, same reminders, same AI extraction) for both, just with
// different marketing copy and a different starter cert library. Picking a
// side is remembered (see lib/industryPref.ts) so this only has to happen
// once; it's reachable again any time via the "/choose" route for anyone who
// wants to switch.
interface Side {
  key: IndustryPref;
  title: string;
  subtitle: string;
  bullets: string[];
  icon: string;
  route: string;
}

const SIDES: Side[] = [
  {
    key: "healthcare",
    title: "Healthcare",
    subtitle: "Clinics, hospitals, and individual healthcare workers",
    bullets: ["BLS, ACLS & PALS", "Vulnerable sector checks", "WHMIS / OSHA compliance"],
    icon: "🏥",
    route: "/home"
  },
  {
    key: "other",
    title: "Other industries",
    subtitle: "Construction, school boards, policing & more",
    bullets: ["Working at Heights & fall protection", "Food handler & mental health first aid", "Use of force & firearms qualification"],
    icon: "🏗️",
    route: "/industries"
  }
];

export default function IndustryChooser() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<IndustryPref | null>(null);

  function choose(side: Side) {
    setIndustryPref(side.key);
    navigate(side.route);
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <div className="pt-8 pb-2 flex flex-col items-center gap-3 px-4">
        <LogoMark className="w-10 h-10" />
        <p className="text-center text-ink-muted text-body max-w-sm">
          One product for tracking hard-expiry certifications. Which side is closer to what you do?
        </p>
      </div>
      <div className="flex-1 flex flex-col sm:flex-row min-h-[520px]">
        {SIDES.map((side, i) => (
          <button
            key={side.key}
            type="button"
            onClick={() => choose(side)}
            onMouseEnter={() => setHovered(side.key)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(side.key)}
            onBlur={() => setHovered(null)}
            // Hover reveal is a subtle brand-tinted wash, not a solid/gradient
            // fill takeover — Dimension keeps its accent to glow/wash-only,
            // even in a full-panel moment like this one. The "other" side is
            // wrapped in data-industry="other" so its wash uses the amber
            // brand tokens (see index.css) without any hardcoded amber
            // classes here.
            className={`group relative flex-1 flex flex-col items-center justify-center text-center px-6 py-16 transition-colors duration-300 ${
              i === 1 ? "border-t sm:border-t-0 sm:border-l border-hairline/10" : ""
            } ${
              (side.key === "healthcare" ? hovered === "healthcare" : hovered === "other")
                ? "bg-brand-500/10"
                : "bg-panel/40"
            }`}
            {...(side.key === "other" ? { "data-industry": "other" } : {})}
          >
            <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 group-focus:scale-110">
              {side.icon}
            </div>
            <h2 className="text-heading-sm sm:text-heading font-medium text-ink mb-2">{side.title}</h2>
            <p className="text-body text-ink-muted max-w-xs mb-5">{side.subtitle}</p>
            <ul className="space-y-1.5 text-caption text-ink-faint">
              {side.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center gap-1.5 text-caption font-medium text-ink border border-hairline dark:border-hairline/15 group-hover:border-brand-500/40 group-focus:border-brand-500/40 rounded-pill px-4 py-1.5 transition-colors">
              Continue <span aria-hidden>→</span>
            </span>
          </button>
        ))}
      </div>
      <p className="text-center text-caption text-ink-faint py-4 px-4">
        Not sure, or your industry isn't listed? Either side works — you can add any certification and
        switch anytime.
      </p>
    </div>
  );
}
