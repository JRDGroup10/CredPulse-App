import { describe, expect, it } from "vitest";
import { buildRenewalSearchUrl } from "./renewalSearch";

// This is the zero-risk fallback shown on every certificate — it must never
// throw, never depend on network state, and always produce a well-formed
// search URL regardless of what's in the cert name (special characters,
// ampersands, parentheses all show up in real cert names like "PALS (Pediatric)").

describe("buildRenewalSearchUrl", () => {
  it("builds a Google search URL containing the cert name and 'renewal course near me'", () => {
    const url = buildRenewalSearchUrl("Basic Life Support (BLS)");
    expect(url).toContain("https://www.google.com/search?q=");
    expect(url).toContain(encodeURIComponent("Basic Life Support (BLS)"));
    expect(url).toContain(encodeURIComponent("renewal course near me"));
  });

  it("URL-encodes special characters safely", () => {
    const url = buildRenewalSearchUrl("WHMIS & Hazard Communication");
    expect(() => new URL(url)).not.toThrow();
    expect(url).not.toContain("&Hazard"); // raw & would corrupt the query string
  });

  it("handles an empty cert name without throwing", () => {
    expect(() => buildRenewalSearchUrl("")).not.toThrow();
  });
});
