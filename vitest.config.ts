import { defineConfig } from "vitest/config";

// Separate from vite.config.ts on purpose — the app's real Vite config
// pulls in the PWA plugin (service worker generation), which has no
// bearing on running unit tests and isn't worth the extra setup cost here.
// Today's suite only covers pure logic (src/lib/*.test.ts) — certificate-
// name matching, .ics generation, status/date math, role/plan lookups —
// so the default "node" environment is enough; add `environment: "jsdom"`
// (and the jsdom dev dependency) if component-level tests are added later.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
