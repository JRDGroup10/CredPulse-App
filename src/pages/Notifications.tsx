import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import { canUseTipsAndLinks, updateProfile } from "../lib/store";
import { PushStatus, getPushSubscriptionStatus, sendTestPush, subscribeToPush, unsubscribeFromPush } from "../lib/push";
import { buildCombinedICS, downloadICS } from "../lib/ics";

const REMINDER_OPTIONS = [90, 60, 30, 14, 7, 3, 1];

/**
 * Everything about how someone gets nudged before a certificate expires,
 * in one place — reminder schedule, push notifications on this device, and
 * a bulk calendar export. Split out of Settings.tsx (which was getting
 * crowded with team/profile/billing sections too) and reachable from the
 * account dropdown (see AccountMenu.tsx) so it's easy to find on its own.
 */
export default function Notifications() {
  const { userId, state, refresh } = useAppState();
  const [saved, setSaved] = useState(false);
  // Reminder-schedule customization applies across all of a person's certs
  // (clinic and personal alike), not one at a time — so unlike per-cert tips
  // and links, team membership alone unlocks it, same as before the
  // clinic/personal cert-scope split existed.
  const canCustomize = !!state.profile.organizationId || canUseTipsAndLinks(state);

  const [pushStatus, setPushStatus] = useState<PushStatus>("checking");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    getPushSubscriptionStatus().then(setPushStatus);
  }, []);

  async function handleEnablePush() {
    setPushBusy(true);
    setPushError(null);
    try {
      await subscribeToPush(userId);
      setPushStatus("subscribed");
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "Couldn't enable push notifications.");
      setPushStatus(Notification.permission === "denied" ? "denied" : "unsubscribed");
    } finally {
      setPushBusy(false);
    }
  }

  async function handleDisablePush() {
    setPushBusy(true);
    try {
      await unsubscribeFromPush();
      setPushStatus("unsubscribed");
    } finally {
      setPushBusy(false);
    }
  }

  async function handleTestPush() {
    setTestBusy(true);
    setTestResult(null);
    try {
      const { sent } = await sendTestPush();
      setTestResult(sent > 0 ? "Sent — check for a notification on this device." : "Nothing to send to — try re-enabling push.");
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : "Couldn't send a test notification.");
    } finally {
      setTestBusy(false);
    }
  }

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

  function handleDownloadAll() {
    const ics = buildCombinedICS(state.certificates, state.profile.reminderDays);
    downloadICS("credpulse-renewals.ics", ics);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Notifications</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          How and when you get reminded before a certificate expires.
        </p>
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
          This same schedule drives your email reminders, push notifications below, and the alarms
          built into any calendar file you download.
        </p>
      </div>

      {pushStatus !== "unsupported" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card">
          <h2 className="font-medium text-slate-900 dark:text-slate-50 mb-1">Push notifications (this device)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Since you've installed CredPulse as an app, you can also get renewal reminders as a
            notification right on this device, on the same schedule as your email reminders.
          </p>

          {pushStatus === "checking" ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Checking…</p>
          ) : pushStatus === "denied" ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Notifications are blocked for this app in your browser or system settings. Allow them
              there, then reload this page to turn this on.
            </p>
          ) : pushStatus === "subscribed" ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Enabled on this device</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTestPush}
                    disabled={testBusy}
                    className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 disabled:opacity-50 transition-colors"
                  >
                    {testBusy ? "Sending…" : "Send test notification"}
                  </button>
                  <button
                    onClick={handleDisablePush}
                    disabled={pushBusy}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-50 transition-colors"
                  >
                    Turn off
                  </button>
                </div>
              </div>
              {testResult && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{testResult}</p>}
            </>
          ) : (
            <button
              onClick={handleEnablePush}
              disabled={pushBusy}
              className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-glow transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
            >
              {pushBusy ? "Enabling…" : "Enable push notifications"}
            </button>
          )}

          {pushError && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{pushError}</p>}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card">
        <h2 className="font-medium text-slate-900 dark:text-slate-50 mb-1">Calendar</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Prefer your own calendar app? Download every certificate's renewal date as one file —
          each one lands as an all-day event with reminders on the schedule above. You can also add
          certificates one at a time from the "Add to calendar" link on each certificate card.
        </p>
        {state.certificates.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Add a certificate first to export it here.</p>
        ) : (
          <button
            onClick={handleDownloadAll}
            className="rounded-md border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Download all as calendar ({state.certificates.length})
          </button>
        )}
      </div>
    </div>
  );
}
