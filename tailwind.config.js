/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"]
      },
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          400: "#3b82f6",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          900: "#1e2a5e"
        },
        accent: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669"
        },
        surface: {
          DEFAULT: "#eaf4fb",
          soft: "#f3f9fd"
        }
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.12)",
        glow: "0 0 0 1px rgba(37, 99, 235, 0.08), 0 20px 40px -12px rgba(37, 99, 235, 0.35)",
        // Amber/orange equivalent of "glow", used on the /industries page so
        // its accent color doesn't come out blue-tinted in the shadows.
        "glow-amber": "0 0 0 1px rgba(217, 119, 6, 0.08), 0 20px 40px -12px rgba(217, 119, 6, 0.35)"
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 }
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-18px) translateX(10px)" }
        },
        floatSlower: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(16px) translateX(-14px)" }
        },
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: 0.6 },
          "70%": { transform: "scale(1.4)", opacity: 0 },
          "100%": { transform: "scale(1.4)", opacity: 0 }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        ringFill: {
          "0%": { strokeDashoffset: "var(--ring-circumference)" },
          "100%": { strokeDashoffset: "var(--ring-offset)" }
        }
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out both",
        "fade-in": "fadeIn 0.4s ease-out both",
        "float-slow": "floatSlow 7s ease-in-out infinite",
        "float-slower": "floatSlower 9s ease-in-out infinite",
        "pulse-ring": "pulseRing 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "ring-fill": "ringFill 1s ease-out forwards"
      }
    }
  },
  plugins: []
};
