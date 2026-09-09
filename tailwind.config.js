/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Dimension's system pairs DM Sans (weight 500 only — never bolder,
      // it's the signature restraint of this look) for display/body copy
      // with Geist for section headings 24px+. Geist isn't on Google Fonts;
      // the source design doc's own substitute for it is Inter, which the
      // app already loads, so `heading` reuses Inter rather than adding a
      // second font CDN dependency. `sans` stays the default body face used
      // everywhere text-sans isn't explicitly overridden.
      fontFamily: {
        sans: ["DM Sans", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        heading: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"]
      },
      // Dimension's named type scale (CRE-13). Use text-display for hero
      // headlines, text-heading-lg/heading/heading-sm for section titles,
      // text-subheading/body for copy, text-caption for labels/metadata.
      // Tailwind's own text-sm/base/lg/xl/etc. remain available for anything
      // not yet migrated to the named scale.
      fontSize: {
        caption: ["13px", { lineHeight: "1.5", letterSpacing: "0.025em" }],
        body: ["16px", { lineHeight: "1.5" }],
        subheading: ["18px", { lineHeight: "1.5" }],
        "heading-sm": ["24px", { lineHeight: "1.33" }],
        heading: ["36px", { lineHeight: "1.11" }],
        "heading-lg": ["48px", { lineHeight: "1" }],
        display: ["72px", { lineHeight: "1", letterSpacing: "-0.035em" }]
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
        },
        // Dimension-system neutral scale (CRE-12) — theme-aware via
        // html.dark in index.css, industry-independent (see the comment
        // above --color-canvas in index.css). Use these for new/updated
        // component styling instead of fixed slate-* classes going forward:
        // bg-canvas (page background), bg-panel (card/nav surface),
        // text-ink / text-ink-muted / text-ink-faint (primary/secondary/
        // tertiary text), border-hairline (1px borders, typically at low
        // opacity via border-hairline/10 on dark surfaces).
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          muted: "rgb(var(--color-ink-muted) / <alpha-value>)",
          faint: "rgb(var(--color-ink-faint) / <alpha-value>)"
        },
        hairline: "rgb(var(--color-hairline) / <alpha-value>)"
      },
      // Dimension border radii (CRE-12): pill for all buttons/nav/tags, panel
      // for standard cards, panel-lg for large feature cards/hero panels, ui
      // for form controls. Existing rounded-* Tailwind defaults stay
      // available for anything not yet migrated.
      borderRadius: {
        pill: "9999px",
        ui: "10px",
        panel: "24px",
        "panel-lg": "40px"
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.12)",
        glow: "0 0 0 1px rgba(var(--color-glow-rgb) / 0.08), 0 20px 40px -12px rgba(var(--color-glow-rgb) / 0.35)",
        // Amber/orange equivalent of "glow", used on the /industries page so
        // its accent color doesn't come out blue-tinted in the shadows.
        "glow-amber": "0 0 0 1px rgba(217, 119, 6, 0.08), 0 20px 40px -12px rgba(217, 119, 6, 0.35)",
        // Dimension's only "elevation" device — a faint inset highlight
        // instead of a drop shadow, meant for dark surfaces (graphite/void
        // canvas). Prefer border-hairline for definition on light surfaces.
        subtle: "rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset"
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
