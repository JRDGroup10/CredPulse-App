import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import { updateProfile } from "../lib/store";
import { PLANS } from "../lib/plans";
import { Region } from "../lib/types";
import TeamSettings from "../components/TeamSettings";

export default function Settings() {
  const { userId, state, refresh } = useAppState();
  const [saved, setSaved] = useState(false);
  const plan = PLANS[state.profile.plan];

  async function setRegion(region: Region) {
    if (region === state.profile.region) return;
    await updateProfile(userId, { region });
    await refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your profile and reminder preferences.</p>
      </div>

      <TeamSettings />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card">
        <h2 className="font-medium text-slate-900 dark:text-slate-50 mb-3">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Name</div>
            <div className="text-slate-700 dark:text-slate-200">{state.profile.name}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Role</div>
            <div className="text-slate-700 dark:text-slate-200">{state.profile.role}</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-slate-400 dark:text-slate-500">Email for reminders</div>
            <div className="text-slate-700 dark:text-slate-200">{state.profile.email}</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">Region</div>
            <div className="grid grid-cols-2 gap-2 max-w-xs">
              {(["CA", "US"] as Region[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`text-sm font-medium py-1.5 rounded-lg border transition-all ${
                    state.profile.region === r
                      ? "bg-brand-600 border-brand-600 text-white shadow-glow"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-600"
                  }`}
                >
                  {r === "CA" ? "🇨🇦 Canada" : "🇺🇸 United States"}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
              Controls which renewal sites and terminology we show for new certificates.
            </p>
            {saved && <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 animate-fade-in">Saved.</div>}
          </div>
          <div className="col-span-2 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-xs text-slate-400 dark:text-slate-500">
                {state.profile.organizationId ? "Personal plan" : "Plan"}
              </div>
              <div className="text-slate-700 dark:text-slate-200">{plan.name}</div>
              {state.profile.organizationId && (
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Covers certs marked "Personal" — separate from your clinic's plan above.
                </div>
              )}
            </div>
            <Link to="/billing" className="text-sm font-medium text-brand-600 dark:text-brand-400 whitespace-nowrap">
              {state.profile.organizationId ? "Manage individual plan" : "Manage plan"}
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card flex items-center justify-between gap-3">
        <div>
          <h2 className="font-medium text-slate-900 dark:text-slate-50 mb-1">Reminders & notifications</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reminder schedule, push notifications on this device, and calendar export.
          </p>
        </div>
        <Link
          to="/notifications"
          className="flex-shrink-0 text-sm font-medium text-brand-600 dark:text-brand-400 whitespace-nowrap"
        >
          Manage →
        </Link>
      </div>
    </div>
  );
}
