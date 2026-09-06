import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// generateApiKey()/listApiKeys()/revokeApiKey() in store.ts back the API
// Keys management page (src/pages/ApiKeys.tsx). The most important property
// to lock in: the plaintext key is never what gets stored — only its
// SHA-256 hash — since that's the entire security model for the public-api
// Edge Function (see its comment block).

let insertedRows: Record<string, unknown>[] = [];
let auditInsertCalls: Record<string, unknown>[] = [];
let updatedRows: { table: string; patch: Record<string, unknown>; id: string }[] = [];
let apiKeyRowForRevoke: { organization_id: string; label: string } | null = null;

vi.mock("./supabaseClient", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "api_keys") {
        return {
          insert: (row: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                insertedRows.push(row);
                return {
                  data: {
                    id: "key-1",
                    label: row.label,
                    key_prefix: row.key_prefix,
                    created_at: "2026-01-01T00:00:00Z",
                    last_used_at: null,
                    revoked_at: null
                  },
                  error: null
                };
              }
            })
          }),
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: apiKeyRowForRevoke, error: null }),
              order: async () => ({ data: [], error: null })
            })
          }),
          update: (patch: Record<string, unknown>) => ({
            eq: async (_col: string, id: string) => {
              updatedRows.push({ table: "api_keys", patch, id });
              return { error: null };
            }
          })
        };
      }
      if (table === "audit_log") {
        return {
          insert: async (row: Record<string, unknown>) => {
            auditInsertCalls.push(row);
            return { error: null };
          }
        };
      }
      throw new Error(`apiKeys.test.ts: unexpected table "${table}"`);
    }
  }
}));

const { generateApiKey, revokeApiKey } = await import("./store");

describe("API key generation and revocation", () => {
  beforeEach(() => {
    insertedRows = [];
    auditInsertCalls = [];
    updatedRows = [];
    apiKeyRowForRevoke = { organization_id: "org-1", label: "Rippling sync" };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("generates a key that only ever stores a hash, never the plaintext", async () => {
    const { key, plaintext } = await generateApiKey("org-1", "user-1", "Rippling sync", {
      name: "Jane Doe",
      email: "jane@example.com"
    });

    expect(plaintext).toMatch(/^cp_live_/);
    expect(key.label).toBe("Rippling sync");
    expect(key.keyPrefix).toBe(plaintext.slice(0, 14));

    expect(insertedRows).toHaveLength(1);
    const stored = insertedRows[0];
    expect(stored.key_hash).not.toBe(plaintext);
    expect(typeof stored.key_hash).toBe("string");
    expect((stored.key_hash as string).length).toBe(64); // SHA-256 hex digest length
    expect(stored.key_prefix).toBe(plaintext.slice(0, 14));
  });

  it("generates a different key (and hash) every time", async () => {
    const first = await generateApiKey("org-1", "user-1", "Key A");
    const second = await generateApiKey("org-1", "user-1", "Key B");
    expect(first.plaintext).not.toBe(second.plaintext);
    expect(insertedRows[0].key_hash).not.toBe(insertedRows[1].key_hash);
  });

  it("logs an audit entry when an actor is provided", async () => {
    await generateApiKey("org-1", "user-1", "Rippling sync", { name: "Jane Doe", email: "jane@example.com" });
    expect(auditInsertCalls).toHaveLength(1);
    expect(auditInsertCalls[0]).toMatchObject({ organization_id: "org-1", action: "api_key.created" });
  });

  it("revokes a key by setting revoked_at, and logs it", async () => {
    await revokeApiKey("key-1", { id: "user-1", name: "Jane Doe", email: "jane@example.com" });
    expect(updatedRows).toHaveLength(1);
    expect(updatedRows[0].patch).toHaveProperty("revoked_at");
    expect(auditInsertCalls).toHaveLength(1);
    expect(auditInsertCalls[0]).toMatchObject({ organization_id: "org-1", action: "api_key.revoked", target_label: "Rippling sync" });
  });
});
