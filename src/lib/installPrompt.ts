import { useEffect, useState } from "react";

// The browser's `beforeinstallprompt` event can fire before React ever
// mounts (it's dispatched as soon as Chrome decides the page is
// installable), so capturing it inside a component's useEffect would risk
// missing it on some page loads. Instead this whole module runs its
// listener-registration once, at import time, and keeps a single shared
// "install state" that any number of components can subscribe to via
// useInstallState() below — the same "capture early, expose via a hook"
// shape as lib/push.ts's standalone-mode check.

export type InstallState =
  | "promptable" // beforeinstallprompt fired — a real install prompt is ready to show
  | "installed" // already running standalone (installed), or just got installed
  | "ios-manual" // iOS Safari: no programmatic install API exists, so show manual instructions
  | "unavailable"; // nothing to offer yet — not installed, not iOS, no prompt event (yet)

// Chrome's `BeforeInstallPromptEvent` isn't in TypeScript's built-in DOM
// lib, since it's a non-standard/Chromium-only event.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(s: InstallState) => void>();

function isStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

// iPadOS 13+ identifies itself as a Mac in the UA string, but iPhones and
// (non-desktop-mode) iPads still say "iPhone/iPad/iPod" — good enough here
// since the fallback for anyone this misses is just "unavailable" (no
// install button shown) rather than anything broken.
function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function computeInitialState(): InstallState {
  // Guards against running at module-load time in a non-browser context
  // (Vitest's "node" test environment has no `window`) — see offlineCache.ts
  // for the same reasoning applied to `localStorage`.
  if (typeof window === "undefined") return "unavailable";
  if (isStandalone()) return "installed";
  if (isIOS()) return "ios-manual";
  return "unavailable";
}

let state: InstallState = computeInitialState();

function setState(next: InstallState): void {
  state = next;
  listeners.forEach((fn) => fn(state));
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevents Chrome's own mini-infobar so InstallAppCard.tsx's UI is the
    // only install prompt the person sees — otherwise they'd see both.
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    if (state !== "installed") setState("promptable");
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    setState("installed");
  });
}

/** React hook — re-renders the calling component whenever the shared
 * install state changes (event fires, prompt is answered, app installs). */
export function useInstallState(): InstallState {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    // Covers the gap between module import and this effect running, in case
    // beforeinstallprompt already fired in that window.
    setS(state);
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return s;
}

/**
 * Shows the browser's native install dialog. Only does anything useful when
 * state is "promptable" — callers should gate their install button on that
 * (see InstallAppCard.tsx) and use the "ios-manual" state to show written
 * instructions instead, since iOS Safari never fires beforeinstallprompt at
 * all and has no equivalent programmatic API.
 *
 * Returns whether the person accepted, so the caller's UI can update right
 * away instead of waiting on the "appinstalled" event, which can lag.
 */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  if (choice.outcome === "accepted") {
    setState("installed");
    return true;
  }
  // Once answered — accepted or dismissed — this exact event can't be
  // reused, and Chrome won't fire a fresh beforeinstallprompt again for a
  // while after a dismissal. "unavailable" reflects that honestly rather
  // than leaving the button up as if it would still work.
  setState("unavailable");
  return false;
}
