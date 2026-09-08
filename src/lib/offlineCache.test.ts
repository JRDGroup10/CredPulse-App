import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearOfflineSnapshot, loadOfflineSnapshot, saveOfflineSnapshot } from "./offlineCache";
import { AppState } from "./types";

// Vitest runs these tests under environment: "node" (see vitest.config.ts) —
// there's no real localStorage, so this is a minimal in-memory stand-in
// rather than pulling in jsdom just for this one file. Good enough to
// exercise offlineCache.ts's actual read/write/JSON logic.
class FakeStorage implements Partial<Storage> {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

const fakeState = { profile: { name: "Jo" }, certificates: [] } as unknown as AppState;

describe("offlineCache", () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: Storage }).localStorage = new FakeStorage() as unknown as Storage;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when nothing has been saved for that user", () => {
    expect(loadOfflineSnapshot("user-1")).toBeNull();
  });

  it("round-trips a saved snapshot with a syncedAt timestamp", () => {
    saveOfflineSnapshot("user-1", fakeState);
    const loaded = loadOfflineSnapshot("user-1");
    expect(loaded).not.toBeNull();
    expect(loaded!.state).toEqual(fakeState);
    expect(typeof loaded!.syncedAt).toBe("string");
    expect(() => new Date(loaded!.syncedAt).toISOString()).not.toThrow();
  });

  it("keys snapshots by user id — one user's save never leaks into another's load", () => {
    saveOfflineSnapshot("user-1", fakeState);
    expect(loadOfflineSnapshot("user-2")).toBeNull();
  });

  it("clearOfflineSnapshot removes only that user's snapshot", () => {
    saveOfflineSnapshot("user-1", fakeState);
    saveOfflineSnapshot("user-2", fakeState);
    clearOfflineSnapshot("user-1");
    expect(loadOfflineSnapshot("user-1")).toBeNull();
    expect(loadOfflineSnapshot("user-2")).not.toBeNull();
  });

  it("fails soft (no throw) when localStorage.setItem throws — e.g. private browsing/quota", () => {
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {}
    } as unknown as Storage;
    expect(() => saveOfflineSnapshot("user-1", fakeState)).not.toThrow();
  });

  it("fails soft (returns null, no throw) when localStorage.getItem throws", () => {
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {},
      removeItem: () => {}
    } as unknown as Storage;
    expect(() => loadOfflineSnapshot("user-1")).not.toThrow();
    expect(loadOfflineSnapshot("user-1")).toBeNull();
  });

  it("fails soft (no throw) when localStorage.removeItem throws", () => {
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {
        throw new Error("SecurityError");
      }
    } as unknown as Storage;
    expect(() => clearOfflineSnapshot("user-1")).not.toThrow();
  });

  it("returns null instead of throwing when stored JSON is corrupted", () => {
    const storage = new FakeStorage();
    storage.setItem("credpulse:offlineSnapshot:user-1", "{not valid json");
    (globalThis as unknown as { localStorage: Storage }).localStorage = storage as unknown as Storage;
    expect(loadOfflineSnapshot("user-1")).toBeNull();
  });
});
