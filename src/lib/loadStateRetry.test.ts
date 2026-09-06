import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Regression test for a real production bug: Sentry caught a PGRST303 "JWT
// issued at future" 401 on the profiles fetch right after sign-in — a
// transient clock-skew race between Supabase's auth service and whichever
// API node handles the very next request. Before the fix, this crashed the
// entire app to the ErrorBoundary's "Something went wrong" screen (because
// useAppState() throws synchronously when state never finished loading).
// loadState() now retries a couple of times on this specific error before
// giving up. Mocks ./supabaseClient so no real network/auth is involved.

let profileCallCount = 0;
let profileShouldFailUntil = 0; // fail with clock-skew error on calls 1..N, succeed after
let profileErrorOverride: { code?: string; message?: string } | null = null;

vi.mock("./supabaseClient", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => {
                profileCallCount++;
                if (profileErrorOverride) {
                  return { data: null, error: profileErrorOverride };
                }
                if (profileCallCount <= profileShouldFailUntil) {
                  return { data: null, error: { code: "PGRST303", message: "JWT issued at future" } };
                }
                return { data: { name: "Jane", email: "jane@example.com" }, error: null };
              }
            })
          })
        };
      }
      if (table === "certificates") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: [], error: null })
            })
          })
        };
      }
      throw new Error(`loadStateRetry.test.ts: unexpected table "${table}"`);
    }
  }
}));

const { loadState } = await import("./store");

describe("loadState retry on transient auth-clock-skew errors", () => {
  beforeEach(() => {
    profileCallCount = 0;
    profileShouldFailUntil = 0;
    profileErrorOverride = null;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("succeeds immediately when there's no error", async () => {
    const promise = loadState("user-1", "jane@example.com");
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.profile.name).toBe("Jane");
    expect(profileCallCount).toBe(1);
  });

  it("retries through transient clock-skew errors and eventually succeeds", async () => {
    profileShouldFailUntil = 2; // fail twice, succeed on the 3rd attempt
    const promise = loadState("user-1", "jane@example.com");
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.profile.name).toBe("Jane");
    expect(profileCallCount).toBe(3);
  });

  it("gives up and throws if the clock skew never resolves", async () => {
    profileShouldFailUntil = 999; // always fails
    const promise = loadState("user-1", "jane@example.com");
    // Attach the rejection assertion (which internally .catch()es the
    // promise) before advancing fake timers, so the rejection is never
    // briefly "unhandled" from Node's point of view.
    const assertion = expect(promise).rejects.toMatchObject({ code: "PGRST303" });
    await vi.runAllTimersAsync();
    await assertion;
    expect(profileCallCount).toBe(3); // exhausts all 3 attempts, doesn't retry forever
  });

  it("throws immediately for a real, non-transient error without retrying", async () => {
    profileErrorOverride = { code: "PGRST116", message: "Row not found" };
    const promise = loadState("user-1", "jane@example.com");
    const assertion = expect(promise).rejects.toMatchObject({ code: "PGRST116" });
    await vi.runAllTimersAsync();
    await assertion;
    expect(profileCallCount).toBe(1); // no retry for unrelated errors
  });
});
