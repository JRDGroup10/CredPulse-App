import { describe, expect, it } from "vitest";
import { buildCertificateICS, buildCombinedICS } from "./ics";
import { Certificate } from "./types";

function cert(overrides: Partial<Certificate>): Certificate {
  return {
    id: "cert-1",
    name: "Basic Life Support (BLS)",
    issuer: "American Heart Association",
    credentialType: "certification",
    issuedDate: "2024-01-01",
    expiryDate: "2026-10-15",
    scope: "personal",
    ...overrides
  };
}

// RFC 5545 requires CRLF line endings and forbids unescaped commas/
// semicolons/newlines inside TEXT properties — a malformed .ics silently
// fails to import in some calendar apps rather than erroring loudly, so
// these are worth pinning down with real assertions instead of just
// eyeballing sample output.
describe("buildCertificateICS", () => {
  it("produces a well-formed single-event calendar", () => {
    const ics = buildCertificateICS(cert({}), [30, 7]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("UID:cert-1@credpulse.app");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261015");
    expect(ics).toContain("DTEND;VALUE=DATE:20261016");
    // Uses CRLF line endings throughout, per spec.
    expect(ics).toContain("\r\n");
    expect(ics).not.toMatch(/[^\r]\n/);
  });

  it("adds one VALARM per reminder day, deduplicated and sorted", () => {
    const ics = buildCertificateICS(cert({}), [30, 7, 7, 90]);
    const alarmCount = (ics.match(/BEGIN:VALARM/g) ?? []).length;
    expect(alarmCount).toBe(3); // 7, 30, 90 — the duplicate 7 collapses
    const sevenIndex = ics.indexOf("TRIGGER:-P7D");
    const thirtyIndex = ics.indexOf("TRIGGER:-P30D");
    const ninetyIndex = ics.indexOf("TRIGGER:-P90D");
    expect(sevenIndex).toBeLessThan(thirtyIndex);
    expect(thirtyIndex).toBeLessThan(ninetyIndex);
  });

  it("omits non-positive reminder days", () => {
    const ics = buildCertificateICS(cert({}), [0, -5, 14]);
    expect((ics.match(/BEGIN:VALARM/g) ?? []).length).toBe(1);
    expect(ics).toContain("TRIGGER:-P14D");
  });

  it("escapes commas and semicolons in the certificate name", () => {
    const ics = buildCertificateICS(cert({ name: "First Aid, Level 2; Advanced" }), []);
    expect(ics).toContain("First Aid\\, Level 2\\; Advanced");
  });

  it("folds lines longer than 75 characters per RFC 5545", () => {
    const longName = "A".repeat(100);
    const ics = buildCertificateICS(cert({ name: longName }), []);
    for (const line of ics.split("\r\n")) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });
});

describe("buildCombinedICS", () => {
  it("bundles multiple certificates into one calendar with one VEVENT each", () => {
    const certs = [cert({ id: "a", name: "BLS" }), cert({ id: "b", name: "ACLS" }), cert({ id: "c", name: "N95 Fit Test" })];
    const ics = buildCombinedICS(certs, [30]);
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(3);
    expect((ics.match(/BEGIN:VCALENDAR/g) ?? []).length).toBe(1);
    expect(ics).toContain("UID:a@credpulse.app");
    expect(ics).toContain("UID:b@credpulse.app");
    expect(ics).toContain("UID:c@credpulse.app");
  });

  it("produces an empty-but-valid calendar for an empty list", () => {
    const ics = buildCombinedICS([], [30]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).not.toContain("BEGIN:VEVENT");
  });
});
