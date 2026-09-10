import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import { updateProfile } from "../lib/store";
import { PLANS } from "../lib/plans";
import { Region } from "../lib/types";
import TeamSettings from "../components/TeamSettings";
import ReferralCard from "../components/ReferralCard";
import InstallAppCard from "../components/InstallAppCard";

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
        <h1 className="text-heading-sm font-medium text-ink">Settings</h1>
        <p className="text-body text-ink-muted mt-0.5">Your profile and reminder preferences.</p>
      </div>

      <TeamSettings />

      <div className="card p-5">
        <h2 className="font-medium text-ink mb-3">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body">
          <div>
            <div className="text-caption text-ink-faint">Name</div>
            <div className="text-ink-muted">{state.profile.name}</div>
          </div>
          <div>
            <div className="text-caption text-ink-faint">Role</div>
            <div className="text-ink-muted">{state.profile.role}</div>
          </div>
          <div className="col-span-2">
            <div className="text-caption text-ink-faint">Email for reminders</div>
            <div className="text-ink-muted">{state.profile.email}</div>
          </div>
          <div className="col-span-2">
            <div className="text-caption text-ink-faint mb-1.5">Region</div>
            <div className="grid grid-cols-2 gap-2 max-w-xs">
              {(["CA", "US"] as Region[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`text-body font-medium py-1.5 rounded-ui border transition-all ${
                    state.profile.region === r
                      ? "bg-brand-500/10 border-brand-500/40 text-brand-400"
                      : "bg-panel border-hairline dark:border-hairline/15 text-ink-muted hover:border-brand-500/30"
                  }`}
                >
                  {r === "CA" ? "🇨🇦 Canada" : "🇺🇸 United States"}
                </button>
              ))}
            </div>
            <p className="text-caption text-ink-faint mt-1.5">
              Controls which renewal sites and terminology we show for new certificates.
            </p>
            {saved && <div className="text-caption text-emerald-500 mt-1.5 animate-fade-in">Saved.</div>}
          </div>
          <div className="col-span-2 flex items-center justify-between pt-2 border-t border-hairline/70 dark:border-hairline/10">
            <div>
              <div className="text-caption text-ink-faint">
                {state.profile.organizationId ? "Personal plan" : "Plan"}
              </div>
              <div className="text-ink-muted">{plan.name}</div>
              {state.profile.organizationId && (
                <div className="text-caption text-ink-faint mt-0.5">
                  Covers certs marked "Personal" — separate from your clinic's plan above.
                </div>
              )}
            </div>
            <Link to="/billing" className="text-body font-medium text-brand-400 whitespace-nowrap">
              {state.profile.organizationId ? "Manage individual plan" : "Manage plan"}
            </Link>
          </div>
        </div>
      </div>

      <InstallAppCard />

      <ReferralCard />

      <div className="card p-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-medium text-ink mb-1">Reminders & notifications</h2>
          <p className="text-caption text-ink-muted">
            Reminder schedule, push notifications on this device, and calendar export.
          </p>
        </div>
        <Link to="/notifications" className="flex-shrink-0 text-body font-medium text-brand-400 whitespace-nowrap">
          Manage →
        </Link>
      </div>
    </div>
  );
}
