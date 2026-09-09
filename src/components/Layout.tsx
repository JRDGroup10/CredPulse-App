import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import { signOut } from "../lib/store";
import { PLANS } from "../lib/plans";
import { useTheme } from "../lib/ThemeContext";
import { marketingHomePath } from "../lib/industryPref";
import Logo from "./Logo";
import AccountMenu from "./AccountMenu";
import TeamInviteBanner from "./TeamInviteBanner";
import OfflineBanner from "./OfflineBanner";
const BASE_NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/add", label: "Add Certificate" },
  { to: "/settings", label: "Settings" }
];

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative w-9 h-9 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-ink/5 dark:hover:bg-white/5 transition"
    >
      <svg
        className={`w-[18px] h-[18px] absolute transition-all duration-300 ${isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg
        className={`w-[18px] h-[18px] absolute transition-all duration-300 ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`}
        viewBox="0 0 24 24" fill="currentColor"
      >
        <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
      </svg>
    </button>
  );
}

function HomeButton() {
  return (
    <Link
      to={marketingHomePath()}
      title="Visit homepage"
      aria-label="Visit homepage"
      className="w-9 h-9 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-ink/5 dark:hover:bg-white/5 transition"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
        <path d="M3 10.5L12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9 21v-6h6v6" />
      </svg>
    </Link>
  );
}

function MenuToggleIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
      {open ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { state, userId } = useAppState();
  const plan = PLANS[state.profile.plan];
  const isOrgAdmin =
    !!state.profile.organizationId && (state.profile.orgRole === "owner" || state.profile.orgRole === "admin");
  const nav = isOrgAdmin
    ? [...BASE_NAV.slice(0, 2), { to: "/team", label: "Team" }, ...BASE_NAV.slice(2)]
    : BASE_NAV;

  // Full nav labels ("Add Certificate", etc.) don't fit in one row on
  // narrow phone screens — cramming them in caused the whole page to
  // overflow horizontally instead of wrapping. Below the `sm` breakpoint,
  // the text links move into this collapsible panel instead.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Always close the mobile menu on navigation — otherwise it stays open
  // over the new page after tapping a link.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    // data-industry drives the amber/orange retint for other-industries
    // accounts — see the CSS variable overrides in index.css and
    // tailwind.config.js. Everything rendered inside this wrapper (the
    // whole authenticated app) picks it up automatically through the color
    // tokens; nothing else needs to change per-component.
    <div
      data-industry={state.profile.industry}
      className="min-h-screen flex flex-col bg-canvas transition-colors"
    >
      {/* Dimension's "floating frosted nav" — a rounded panel with visible
          margin from the viewport edge and a hairline border, rather than a
          flat bar flush to the top. Wrapper carries the sticky positioning
          and edge margin; the inner div is the actual panel surface so the
          rounded corners + border + blur read as one detached element. */}
      {/* pt-4/top-4 give the panel real breathing room from the viewport
          edge at rest and while stuck, per the source system's "never
          flush to the edge" rule for this component. */}
      <header className="no-print sticky top-4 z-10 px-3 pt-4">
        <div className="max-w-3xl mx-auto rounded-[19px] border border-hairline/70 dark:border-hairline/10 bg-panel/80 backdrop-blur-md shadow-subtle">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1 min-w-0">
              <HomeButton />
              <Link to="/" className="inline-flex items-center pl-1 min-w-0 transition-transform hover:scale-105">
                <Logo markClassName="w-8 h-8" textClassName="text-base" />
              </Link>
            </div>

            {/* Full nav — sm and up only. */}
            <nav className="hidden sm:flex items-center gap-1">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-pill text-caption font-normal whitespace-nowrap transition-all ${
                    pathname === item.to
                      ? "bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
                      : "text-ink/85 hover:bg-ink/5 dark:hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="ml-1 pl-1 border-l border-hairline/70 dark:border-hairline/15 flex items-center gap-1">
                <ThemeToggle />
                <AccountMenu profile={state.profile} planName={plan.name} userId={userId} />
              </div>
            </nav>

            {/* Compact controls + hamburger — below sm only. */}
            <div className="flex sm:hidden items-center gap-1 flex-shrink-0">
              <ThemeToggle />
              <AccountMenu profile={state.profile} planName={plan.name} userId={userId} />
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                className="w-9 h-9 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-ink/5 dark:hover:bg-white/5 transition"
              >
                <MenuToggleIcon open={mobileMenuOpen} />
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="sm:hidden border-t border-hairline/70 dark:border-hairline/10 px-4 py-2 flex flex-col gap-0.5 animate-fade-in-up">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2.5 rounded-pill text-caption font-normal transition-all ${
                    pathname === item.to
                      ? "bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
                      : "text-ink/85 hover:bg-ink/5 dark:hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>
      <OfflineBanner />
      <TeamInviteBanner />
      <main key={pathname} className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 animate-fade-in-up">
        {children}
      </main>
      <footer className="no-print border-t border-hairline/70 dark:border-hairline/10 bg-canvas">
        <div className="max-w-3xl mx-auto px-4 py-3 text-caption text-ink-faint flex justify-between items-center">
          <span>Signed in as {state.profile.name || state.profile.email}</span>
          <div className="flex items-center gap-3">
            <Link to="/terms" className="hover:text-ink transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
            <button onClick={() => signOut(userId)} className="font-medium text-ink-muted hover:text-ink transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
