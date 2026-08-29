import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import { getRecommendedCertifications } from "../lib/roleChecklist";

/**
 * The "instant relevance" onboarding moment: the second someone tells us
 * their role at signup, we already know roughly what they need to track —
 * so instead of a blank dashboard, they see a checklist of exactly which
 * certifications to add. Disappears item-by-item as matching certificates
 * are added, and disappears entirely once nothing's left (or if dismissed
 * for this session).
 */
export default function RoleChecklistCard() {
  const { state } = useAppState();
  const [dismissed, setDismissed] = useState(false);

  const recommended = getRecommendedCertifications(state.profile.role, state.profile.region);
  const missing = recommended.filter((item) => !state.certificates.some((c) => item.match.test(c.name)));

  if (dismissed || missing.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-brand-100 dark:border-brand-900 bg-brand-50 dark:bg-brand-500/10 p-4 animate-fade-in-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-brand-800 dark:text-brand-300">
            Recommended for {state.profile.role || "your role"}
          </div>
          <p className="text-xs text-brand-700/80 dark:text-brand-300/80 mt-0.5">
            Based on your role, here's what most people in it track. Add what applies to you.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-brand-700/60 hover:text-brand-800 dark:text-brand-300/60 dark:hover:text-brand-200 flex-shrink-0"
        >
          Dismiss
        </button>
      </div>
      <ul className="mt-3 space-y-1.5">
        {missing.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-brand-900 dark:text-brand-100">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 dark:bg-brand-500 flex-shrink-0" />
              {item.name}
            </span>
            <Link
              to="/add"
              className="text-xs font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-900 dark:hover:text-brand-100 whitespace-nowrap"
            >
              Add →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
