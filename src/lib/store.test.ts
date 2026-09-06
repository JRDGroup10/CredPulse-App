import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { daysUntil, statusFor } from "./store";

// statusFor()'s thresholds drive every status badge, dashboard stat, Team.tsx
// compliance rollup, and the reminder/push-notification schedule in this
// app — getting the boundary days wrong (e.g. off-by-one so something
// shows "valid" a day after it's actually expired) would be a real,
// user-visible compliance bug. Pinned to a fixed "now" so these don't
// become flaky as real time passes.
describe("daysUntil / statusFor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("daysUntil counts whole days regardless of time-of-day", () => {
    expect(daysUntil("2026-06-15")).toBe(0);
    expect(daysUntil("2026-06-16")).toBe(1);
    expect(daysUntil("2026-06-14")).toBe(-1);
    expect(daysUntil("2026-07-15")).toBe(30);
  });

  it("treats yesterday and earlier as expired", () => {
    expect(statusFor("2026-06-14")).toBe("expired");
    expect(statusFor("2026-01-01")).toBe("expired");
  });

  it("treats today through 14 days out as urgent", () => {
    expect(statusFor("2026-06-15")).toBe("urgent"); // due today
    expect(statusFor("2026-06-29")).toBe("urgent"); // exactly 14 days
  });

  it("treats 15 to 60 days out as upcoming", () => {
    expect(statusFor("2026-06-30")).toBe("upcoming"); // exactly 15 days
    expect(statusFor("2026-08-14")).toBe("upcoming"); // exactly 60 days
  });

  it("treats anything past 60 days as valid", () => {
    expect(statusFor("2026-08-15")).toBe("valid"); // exactly 61 days
    expect(statusFor("2027-06-15")).toBe("valid");
  });
});
