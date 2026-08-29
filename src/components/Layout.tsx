import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import { signOut } from "../lib/store";
import { PLANS } from "../lib/plans";
import { useTheme } from "../lib/ThemeContext";
import Logo from "./Logo";
import AccountMenu from "./AccountMenu";
import TeamInviteBanner from "./TeamInviteBanner";
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
      className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition"
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
      to="/home"
      title="Visit homepage"
      aria-label="Visit homepage"
      className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
        <path d="M3 10.5L12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9 21v-6h6v6" />
      </svg>
    </Link>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { state } = useAppState();
  const plan = PLANS[state.profile.plan];
  const isOrgAdmin =
    !!state.profile.organizationId && (state.profile.orgRole === "owner" || state.profile.orgRole === "admin");
  const nav = isOrgAdmin
    ? [...BASE_NAV.slice(0, 2), { to: "/team", label: "Team" }, ...BASE_NAV.slice(2)]
    : BASE_NAV;

  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-950 transition-colors">
      <header className="border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <HomeButton />
            <Link to="/" className="inline-flex items-center pl-1 transition-transform hover:scale-105">
              <Logo markClassName="w-8 h-8" textClassName="text-base" />
            </Link>
          </div>
          <nav className="flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  pathname === item.to
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="ml-1 pl-1 border-l border-slate-200 dark:border-slate-700 flex items-center gap-1">
              <ThemeToggle />
              <AccountMenu profile={state.profile} planName={plan.name} />
            </div>
          </nav>
        </div>
      </header>
      <TeamInviteBanner />
      <main key={pathname} className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 animate-fade-in-up">
        {children}
      </main>
      <footer className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 py-3 text-xs text-slate-400 dark:text-slate-500 flex justify-between items-center">
          <span>Signed in as {state.profile.name || state.profile.email}</span>
          <div className="flex items-center gap-3">
            <Link to="/terms" className="hover:text-slate-600 dark:hover:text-slate-300">Terms</Link>
            <Link to="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300">Privacy</Link>
            <button onClick={() => signOut()} className="font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
