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

export default function AccountMenu({
  profile,
  planName,
  userId
}: {
  profile: UserProfile;
  planName: string;
  userId: string;
}) {
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
      <div className="absolute right-0 mt-2 w-56 card p-3 z-30 animate-fade-in-up">
        <div className="px-1 pb-2 mb-2 border-b border-hairline/70 dark:border-hairline/10">
          <div className="font-medium text-body text-ink truncate">
            {profile.name || profile.email}
          </div>
          <div className="text-caption text-ink-faint truncate">
            {profile.role || "Healthcare worker"}
          </div>
          <div className="mt-1.5 badge-pill bg-brand-500/10 text-brand-700 dark:text-brand-400">
            {planName} plan
          </div>
        </div>
        <Link
          to="/billing"
          onClick={close}
          className="block px-1 py-1.5 text-body rounded-ui text-ink-muted hover:bg-ink/5 hover:text-ink transition-colors"
        >
          Manage billing
        </Link>
        <Link
          to="/settings"
          onClick={close}
          className="block px-1 py-1.5 text-body rounded-ui text-ink-muted hover:bg-ink/5 hover:text-ink transition-colors"
        >
          Settings
        </Link>
        <Link
          to="/notifications"
          onClick={close}
          className="block px-1 py-1.5 text-body rounded-ui text-ink-muted hover:bg-ink/5 hover:text-ink transition-colors"
        >
          Notifications
        </Link>
        <Link
          to={marketingHomePath()}
          onClick={close}
          className="block px-1 py-1.5 text-body rounded-ui text-ink-muted hover:bg-ink/5 hover:text-ink transition-colors"
        >
          Visit homepage
        </Link>
        <button
          onClick={() => {
            close();
            signOut(userId);
          }}
          className="w-full text-left px-1 py-1.5 text-body rounded-ui text-ink-muted hover:bg-ink/5 hover:text-ink transition-colors"
        >
          Sign out
        </button>
      </div>
    </details>
  );
}
