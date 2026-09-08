import { describe, expect, it } from "vitest";
import { sumCeuCredits } from "./store";
import { CeuCreditLog } from "./types";

// sumCeuCredits() drives the progress bar, the shortfall message, and the
// "met the goal" styling in CeuTracker.tsx — getting this wrong means either
// telling someone they've met a CEU requirement they haven't, or nagging
// them about a shortfall that's already closed.

function makeLog(overrides: Partial<CeuCreditLog> = {}): CeuCreditLog {
  return {
    id: "log-1",
    certificateId: "cert-1",
    credits: 1,
    activityName: "Online module",
    completedDate: "2026-01-01",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides
  };
}

describe("sumCeuCredits", () => {
  it("returns 0 for no logs", () => {
    expect(sumCeuCredits([])).toBe(0);
  });

  it("sums whole-number credits across multiple logs", () => {
    const logs = [makeLog({ id: "1", credits: 10 }), makeLog({ id: "2", credits: 15 }), makeLog({ id: "3", credits: 11 })];
    expect(sumCeuCredits(logs)).toBe(36);
  });

  it("handles fractional (half) credits without floating-point drift", () => {
    const logs = [makeLog({ id: "1", credits: 0.5 }), makeLog({ id: "2", credits: 0.5 }), makeLog({ id: "3", credits: 1.5 })];
    expect(sumCeuCredits(logs)).toBeCloseTo(2.5, 5);
  });

  it("a single log's total matches its own credit value", () => {
    expect(sumCeuCredits([makeLog({ credits: 7 })])).toBe(7);
  });
});
