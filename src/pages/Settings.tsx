import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import { canUseTipsAndLinks, updateProfile } from "../lib/store";
import { PLANS } from "../lib/plans";
import { Region } from "../lib/types";

const REMINDER_OPTIONS = [90, 60, 30, 14, 7, 3, 1];

export default function Settings() {
  const { userId, state, refresh } = useAppState();
  const [saved, setSaved] = useState(false);
  const canCustomize = canUseTipsAndLinks(state);
  const plan = PLANS[state.profile.plan];

  async function toggleReminder(day: number) {
    const has = state.profile.reminderDays.includes(day);
    const next = has
      ? state.profile.reminderDays.filter((d) => d !== day)
      : [...state.profile.reminderDays, day].sort((a, b) => b - a);
    await updateProfile(userId, { reminderDays: next });
    await refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

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

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card">
        <h2 className="font-medium text-slate-900 dark:text-slate-50 mb-3">Profile</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
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
          </div>
          <div className="col-span-2 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-xs text-slate-400 dark:text-slate-500">Plan</div>
              <div className="text-slate-700 dark:text-slate-200">{plan.name}</div>
            </div>
            <Link to="/billing" className="text-sm font-medium text-brand-600 dark:text-brand-400">
              Manage plan
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card">
        <h2 className="font-medium text-slate-900 dark:text-slate-50 mb-1">Reminder schedule</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Get notified this many days before each certificate expires.
        </p>
        {canCustomize ? (
          <>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((day) => {
                const active = state.profile.reminderDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleReminder(day)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      active
                        ? "bg-brand-600 border-brand-600 text-white shadow-glow"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-600"
                    }`}
                  >
                    {day}d
                  </button>
                );
              })}
            </div>
            {saved && <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 animate-fade-in">Saved.</div>}
          </>
        ) : (
          <div className="rounded-lg border border-brand-100 dark:border-brand-900 bg-brand-50 dark:bg-brand-500/10 px-3 py-3 text-sm text-brand-700 dark:text-brand-300 flex items-center justify-between gap-3">
            <span>Free plan includes one monthly reminder. Upgrade to set a custom schedule.</span>
            <Link to="/billing" className="font-semibold whitespace-nowrap">
              Upgrade
            </Link>
          </div>
        )}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4">
          This schedule is saved to your account. Actually sending the emails at each threshold
          still needs one more piece — a scheduled job — see README "Reminders" section.
        </p>
      </div>
    </div>
  );
}
