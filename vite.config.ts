import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
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
