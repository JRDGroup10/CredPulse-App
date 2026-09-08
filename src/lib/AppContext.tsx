import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { AppState } from "./types";
import { loadState } from "./store";
import { reportError } from "./errorMonitoring";
import { clearOfflineSnapshot, loadOfflineSnapshot, saveOfflineSnapshot } from "./offlineCache";

interface Ctx {
  session: Session | null;
  loading: boolean; // true whenever session/state are being (re)fetched — initial load AND after login/logout
  state: AppState | null;
  setState: React.Dispatch<React.SetStateAction<AppState | null>>;
  refresh: () => Promise<void>;
  // True while Auth.tsx is mid-way through a login attempt, checking whether
  // the account's industry (see lib/industryPref.ts) matches the page it
  // logged in from. Supabase flips `session` truthy the instant signIn()
  // succeeds — before that check can run — so without this flag, App.tsx
  // would render the real dashboard for a flash even when the login is
  // about to be rejected and signed back out. See Auth.tsx.
  authGating: boolean;
  setAuthGating: (v: boolean) => void;
  // Set only when the current `state` came from offlineCache.ts instead of
  // a live load (see loadFor()'s catch block below) — the ISO timestamp of
  // when that data was last actually synced. null means `state` is live.
  // Layout.tsx/Dashboard.tsx use this to show a "you're offline" banner
  // instead of silently passing off stale data as current.
  offlineSyncedAt: string | null;
}

const AppStateContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [authGating, setAuthGating] = useState(false);
  const [offlineSyncedAt, setOfflineSyncedAt] = useState<string | null>(null);

  async function loadFor(s: Session | null) {
    if (!s) {
      setState(null);
      setOfflineSyncedAt(null);
      return;
    }
    try {
      const next = await loadState(s.user.id, s.user.email ?? "");
      setState(next);
      setOfflineSyncedAt(null);
      // Snapshot every successful load so a later failure (no connection)
      // has something recent to fall back to instead of an error screen.
      saveOfflineSnapshot(s.user.id, next);
    } catch (err) {
      // loadState() already retries a couple of times internally for the
      // transient auth-clock-skew error (see store.ts) — if it still throws
      // here, either that didn't resolve in time or it's a real error (most
      // commonly: no network connection). Report it either way so real,
      // persistent failures stay visible in Sentry, then fall back to the
      // last successful snapshot for this same user if one exists — seeing
      // slightly stale certs beats seeing the ErrorBoundary's generic
      // "something went wrong" screen when the actual cause is just "you're
      // offline right now." If there's no cached snapshot (first-ever load
      // with no connection), `state` stays whatever it was — usually null —
      // and the existing ErrorBoundary behavior is unchanged.
      reportError(err, { context: "AppContext.loadFor", userId: s.user.id });
      const cached = loadOfflineSnapshot(s.user.id);
      if (cached) {
        setState(cached.state);
        setOfflineSyncedAt(cached.syncedAt);
      }
    }
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      try {
        await loadFor(data.session);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    // IMPORTANT: this callback must stay synchronous and must not directly
    // await another Supabase call. Supabase's client holds an internal lock
    // while processing an auth event (sign-in, token refresh, etc.); a
    // Supabase query awaited straight inside this callback can end up
    // waiting on that same lock and never resolve — which is exactly what
    // caused sign-in to get stuck on the loading spinner until a manual
    // page refresh. Deferring the follow-up work with setTimeout(0) moves
    // it to a fresh macrotask, after Supabase has released the lock.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setTimeout(async () => {
        if (!mounted) return;
        setLoading(true);
        setSession(newSession);
        try {
          await loadFor(newSession);
        } finally {
          if (mounted) setLoading(false);
        }
      }, 0);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        session,
        loading,
        state,
        setState,
        refresh: () => loadFor(session),
        authGating,
        setAuthGating,
        offlineSyncedAt
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

/** Raw context access — used at the top-level router to decide which screen
 * to show, and by pre-session flows like ClinicSignup that need to force a
 * reload of profile/cert state right after creating an org (so the app
 * reflects it immediately instead of waiting for the next natural reload). */
export function useAuth() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAuth must be used within AppStateProvider");
  return {
    session: ctx.session,
    loading: ctx.loading,
    refresh: ctx.refresh,
    authGating: ctx.authGating,
    setAuthGating: ctx.setAuthGating
  };
}

/**
 * For pages inside the authenticated app — asserts state is already loaded.
 * Only mount these pages once App.tsx has confirmed session + state exist.
 */
export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  if (!ctx.state || !ctx.session) {
    throw new Error("useAppState called before data finished loading — check App.tsx routing guards");
  }
  const session = ctx.session;
  const state = ctx.state;
  return {
    userId: session.user.id,
    state,
    setState: ctx.setState as React.Dispatch<React.SetStateAction<AppState>>,
    refresh: ctx.refresh,
    offlineSyncedAt: ctx.offlineSyncedAt
  };
}
