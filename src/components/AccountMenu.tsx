// Top-right account menu shown throughout the logged-in app (see Layout.tsx).
// A small avatar with the user's initials that expands into a dropdown with
// their name, role, and current plan, plus quick links to billing/settings
// and sign out.
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { signOut } from "../lib/store";
import { UserProfile } from "../lib/types";
import { marketingHomePath } from "../lib/industryPref";

function initials(profile: UserProfile): string {
  const source = (profile.name || "").trim() || profile.email || "";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AccountMenu({ profile, planName }: { profile: UserProfile; planName: string }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Close the dropdown on any click outside it — <details> doesn't do this
  // natively, and it also doesn't auto-close after a Link inside it navigates.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (detailsRef.current && detailsRef.current.open && !detailsRef.current.contains(e.target as Node)) {
        detailsRef.current.open = false;
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  function close() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <details ref={detailsRef} className="relative">
      <summary
        className="list-none w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-brand-500 text-white text-xs font-semibold flex items-center justify-center cursor-pointer shadow-sm hover:shadow-glow transition-all select-none [&::-webkit-details-marker]:hidden"
        aria-label="Account menu"
        title={profile.name || profile.email}
      >
        {initials(profile)}
      </summary>
      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-card p-3 z-30 animate-fade-in-up">
        <div className="px-1 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">
            {profile.name || profile.email}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {profile.role || "Healthcare worker"}
          </div>
          <div className="mt-1.5 inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-300">
            {planName} plan
          </div>
        </div>
        <Link
          to="/billing"
          onClick={close}
          className="block px-1 py-1.5 text-sm rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
        >
          Manage billing
        </Link>
        <Link
          to="/settings"
          onClick={close}
          className="block px-1 py-1.5 text-sm rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
        >
          Settings
        </Link>
        <Link
          to={marketingHomePath()}
          onClick={close}
          className="block px-1 py-1.5 text-sm rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
        >
          Visit homepage
        </Link>
        <button
          onClick={() => {
            close();
            signOut();
          }}
          className="w-full text-left px-1 py-1.5 text-sm rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
        >
          Sign out
        </button>
      </div>
    </details>
  );
}
