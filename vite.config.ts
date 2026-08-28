import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Switched from the default generated service worker to a custom one
      // (src/sw.ts) so we can add push-notification handling for
      // certificate-expiry reminders. See src/sw.ts for details.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        injectionPoint: "self.__WB_MANIFEST"
      },
      // Without this, `npm run dev` never registers a service worker at all
      // (only `npm run build` + `npm run preview` did) — meaning push
      // notifications had nothing to attach to. This makes dev mode behave
      // the same way for testing.
      devOptions: {
        enabled: true,
        type: "module"
      },
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "CredPulse",
        short_name: "CredPulse",
        description:
          "Track certification renewals for healthcare workers — never miss a BLS, ACLS, or credential deadline again.",
        start_url: "/",
        display: "standalone",
        background_color: "#eaf4fb",
        theme_color: "#0B2A4A",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      }
    })
  ],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 }
});
