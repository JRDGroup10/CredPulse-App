import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import { signOut } from "../lib/store";
import { PLANS } from "../lib/plans";
import { useTheme } from "../lib/ThemeContext";

const NAV = [
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

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { state } = useAppState();
  const plan = PLANS[state.profile.plan];

  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-950 transition-colors">
      <header className="border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-sm shadow-glow transition-transform group-hover:scale-105">
              CP
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-50">CredPulse</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
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
            <Link
              to="/billing"
              className={`ml-1 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                pathname === "/billing"
                  ? "bg-brand-600 text-white border-brand-600"
                  : state.profile.plan === "free"
                  ? "border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-800 dark:text-brand-300 dark:hover:bg-brand-900/40"
                  : "border-accent-200 text-accent-600 hover:bg-accent-50 dark:border-accent-800 dark:text-accent-400 dark:hover:bg-accent-900/20"
              }`}
            >
              {plan.name} plan
            </Link>
            <div className="ml-1 pl-1 border-l border-slate-200 dark:border-slate-700">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>
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
