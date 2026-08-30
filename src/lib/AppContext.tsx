import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { AppState } from "./types";
import { loadState } from "./store";

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
}

const AppStateContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [authGating, setAuthGating] = useState(false);

  async function loadFor(s: Session | null) {
    if (!s) {
      setState(null);
      return;
    }
    const next = await loadState(s.user.id, s.user.email ?? "");
    setState(next);
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadFor(data.session);
      if (mounted) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setLoading(true);
      setSession(newSession);
      await loadFor(newSession);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppStateContext.Provider
      value={{ session, loading, state, setState, refresh: () => loadFor(session), authGating, setAuthGating }}
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
    refresh: ctx.refresh
  };
}
