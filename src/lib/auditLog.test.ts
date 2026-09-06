import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Audit logging (see logAudit() in store.ts) is a best-effort side effect —
// it should never block or fail the real action it's attached to (a
// certificate delete has already succeeded by the time it runs), even if
// the audit_log insert itself fails for some reason (RLS misconfigured,
// network hiccup, whatever). These tests exercise that through
// removeCertificate(), since logAudit() itself isn't exported.

let certDeleteCalls = 0;
let auditInsertCalls: Record<string, unknown>[] = [];
let auditInsertShouldFail = false;

vi.mock("./supabaseClient", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "certificates") {
        return {
          delete: () => ({
            eq: async () => {
              certDeleteCalls++;
              return { error: null };
            }
          })
        };
      }
      if (table === "audit_log") {
        return {
          insert: async (row: Record<string, unknown>) => {
            auditInsertCalls.push(row);
            return { error: auditInsertShouldFail ? { message: "insert failed" } : null };
          }
        };
      }
      throw new Error(`auditLog.test.ts: unexpected table "${table}"`);
    },
    storage: {
      from: () => ({
        remove: async () => ({ error: null })
      })
    }
  }
}));

const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

const { removeCertificate } = await import("./store");

describe("audit logging is best-effort and never blocks the real action", () => {
  beforeEach(() => {
    certDeleteCalls = 0;
    auditInsertCalls = [];
    auditInsertShouldFail = false;
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("doesn't write an audit entry when no audit context is passed", async () => {
    await removeCertificate("cert-1");
    expect(certDeleteCalls).toBe(1);
    expect(auditInsertCalls).toHaveLength(0);
  });

  it("writes an audit entry for a clinic-scoped delete with context", async () => {
    await removeCertificate("cert-1", undefined, {
      id: "user-1",
      name: "Jane Doe",
      email: "jane@example.com",
      organizationId: "org-1",
      certName: "BLS"
    });
    expect(certDeleteCalls).toBe(1);
    expect(auditInsertCalls).toHaveLength(1);
    expect(auditInsertCalls[0]).toMatchObject({
      organization_id: "org-1",
      actor_id: "user-1",
      action: "certificate.deleted",
      target_label: "BLS"
    });
  });

  it("still succeeds even if the audit_log insert itself fails", async () => {
    auditInsertShouldFail = true;
    await expect(
      removeCertificate("cert-1", undefined, {
        id: "user-1",
        name: "Jane Doe",
        email: "jane@example.com",
        organizationId: "org-1",
        certName: "BLS"
      })
    ).resolves.toBeUndefined();
    expect(certDeleteCalls).toBe(1);
    // Reported locally (no Sentry DSN in the test env) instead of thrown.
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
