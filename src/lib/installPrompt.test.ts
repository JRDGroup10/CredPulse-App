import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// installPrompt.ts registers its `beforeinstallprompt`/`appinstalled`
// listeners once, at module import time, against whatever `window` exists
// then — necessary in real usage (see the module's own comment: Chrome can
// fire beforeinstallprompt before React mounts), but it means each test
// here needs its own fresh module instance importing against its own fake
// `window`, rather than one shared import. Vitest runs under
// environment: "node" (see vitest.config.ts) — there's no real `window` at
// all, so a minimal EventTarget-based stand-in is set up per test instead
// of pulling in jsdom just for this one file.
//
// There's no React renderer available in this project's test setup either
// (see vitest config / package.json — no jsdom, no @testing-library/react),
// so useInstallState() itself isn't exercised here; these tests cover the
// same underlying state machine through promptInstall() and the raw
// beforeinstallprompt/appinstalled event handling instead.

class FakeWindow extends EventTarget {
  navigator: { userAgent: string; standalone?: boolean };
  private standaloneDisplayMode: boolean;

  constructor(opts: { userAgent: string; standalone?: boolean; standaloneDisplayMode?: boolean }) {
    super();
    this.navigator = { userAgent: opts.userAgent, standalone: opts.standalone };
    this.standaloneDisplayMode = opts.standaloneDisplayMode ?? false;
  }

  matchMedia(query: string) {
    return { matches: query.includes("standalone") ? this.standaloneDisplayMode : false };
  }
}

function makeBeforeInstallPromptEvent(outcome: "accepted" | "dismissed") {
  const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string; platform: string }>;
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome, platform: "web" });
  return event;
}

async function freshModule(fakeWindow: FakeWindow) {
  vi.resetModules();
  (globalThis as unknown as { window: FakeWindow }).window = fakeWindow;
  return import("./installPrompt");
}

describe("installPrompt", () => {
  afterEach(() => {
    delete (globalThis as unknown as { window?: FakeWindow }).window;
    vi.restoreAllMocks();
  });

  it("promptInstall() resolves false when no beforeinstallprompt has fired yet", async () => {
    const fakeWindow = new FakeWindow({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" });
    const { promptInstall } = await freshModule(fakeWindow);
    await expect(promptInstall()).resolves.toBe(false);
  });

  it("calls preventDefault on beforeinstallprompt to suppress Chrome's own mini-infobar", async () => {
    const fakeWindow = new FakeWindow({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" });
    await freshModule(fakeWindow);
    const event = makeBeforeInstallPromptEvent("accepted");
    const spy = vi.spyOn(event, "preventDefault");
    fakeWindow.dispatchEvent(event);
    expect(spy).toHaveBeenCalled();
  });

  it("promptInstall() calls prompt() and resolves true when the user accepts", async () => {
    const fakeWindow = new FakeWindow({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" });
    const { promptInstall } = await freshModule(fakeWindow);
    const event = makeBeforeInstallPromptEvent("accepted");
    fakeWindow.dispatchEvent(event);

    await expect(promptInstall()).resolves.toBe(true);
    expect(event.prompt).toHaveBeenCalledTimes(1);
  });

  it("promptInstall() resolves false when the user dismisses, and the event can't be reused", async () => {
    const fakeWindow = new FakeWindow({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" });
    const { promptInstall } = await freshModule(fakeWindow);
    const event = makeBeforeInstallPromptEvent("dismissed");
    fakeWindow.dispatchEvent(event);

    await expect(promptInstall()).resolves.toBe(false);
    // A second call has no captured event left to show — must not throw or
    // re-show anything.
    await expect(promptInstall()).resolves.toBe(false);
  });

  it("appinstalled clears the captured prompt so a later promptInstall() is a no-op", async () => {
    const fakeWindow = new FakeWindow({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" });
    const { promptInstall } = await freshModule(fakeWindow);
    const event = makeBeforeInstallPromptEvent("accepted");
    fakeWindow.dispatchEvent(event);
    fakeWindow.dispatchEvent(new Event("appinstalled"));

    await expect(promptInstall()).resolves.toBe(false);
    expect(event.prompt).not.toHaveBeenCalled();
  });
});
