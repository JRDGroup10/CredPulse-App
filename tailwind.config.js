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
        // Defined as CSS variables (see :root / [data-industry="other"] in
        // index.css) rather than fixed hex values, so the entire
        // authenticated app can be retinted amber/orange for an
        // other-industries account just by toggling one data attribute in
        // Layout.tsx — no per-component changes needed. The `rgb(... /
        // <alpha-value>)` form is Tailwind's documented pattern for keeping
        // opacity modifiers (bg-brand-500/10, etc.) working with
        // variable-backed colors; the variables themselves hold
        // space-separated R G B components, not hex strings.
        brand: {
          50: "rgb(var(--color-brand-50) / <alpha-value>)",
          100: "rgb(var(--color-brand-100) / <alpha-value>)",
          200: "rgb(var(--color-brand-200) / <alpha-value>)",
          300: "rgb(var(--color-brand-300) / <alpha-value>)",
          400: "rgb(var(--color-brand-400) / <alpha-value>)",
          500: "rgb(var(--color-brand-500) / <alpha-value>)",
          600: "rgb(var(--color-brand-600) / <alpha-value>)",
          700: "rgb(var(--color-brand-700) / <alpha-value>)",
          800: "rgb(var(--color-brand-800) / <alpha-value>)",
          900: "rgb(var(--color-brand-900) / <alpha-value>)"
        },
        accent: {
          50: "rgb(var(--color-accent-50) / <alpha-value>)",
          100: "rgb(var(--color-accent-100) / <alpha-value>)",
          200: "rgb(var(--color-accent-200) / <alpha-value>)",
          300: "rgb(var(--color-accent-300) / <alpha-value>)",
          400: "rgb(var(--color-accent-400) / <alpha-value>)",
          500: "rgb(var(--color-accent-500) / <alpha-value>)",
          600: "rgb(var(--color-accent-600) / <alpha-value>)",
          700: "rgb(var(--color-accent-700) / <alpha-value>)",
          800: "rgb(var(--color-accent-800) / <alpha-value>)",
          900: "rgb(var(--color-accent-900) / <alpha-value>)"
        },
        surface: {
          DEFAULT: "#eaf4fb",
          soft: "#f3f9fd"
        }
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.12)",
        glow: "0 0 0 1px rgba(var(--color-glow-rgb) / 0.08), 0 20px 40px -12px rgba(var(--color-glow-rgb) / 0.35)",
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
