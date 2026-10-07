/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantic Theme Tokens (mapped to CSS variables in index.css)
        canvas: "var(--bg-canvas)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        sunken: "var(--bg-sunken)",
        "border-subtle": "var(--border-subtle)",
        "border-default": "var(--border-default)",
        "border-strong": "var(--border-strong)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-inverse": "var(--text-inverse)",
        "brand-primary": "var(--brand-primary)",
        "brand-primary-hover": "var(--brand-primary-hover)",
        "brand-accent": "var(--brand-accent)",
        "state-success": "var(--state-success)",
        "state-warning": "var(--state-warning)",
        "state-error": "var(--state-error)",
        "state-info": "var(--state-info)",

        // Legacy tokens (preserved for gradual phase-by-phase migration)
        brand: {
          dark: "#090D16",
          card: "#111827",
          border: "#1F2937",
          accent: "#10B981", // Financial Emerald
          indigo: "#6366F1", // Electric Indigo
          danger: "#F43F5E", // Rose
          warning: "#F59E0B", // Amber
          muted: "#94A3B8"
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif"
        ]
      },
      boxShadow: {
        theme: "var(--shadow-card)",
        "theme-sm": "var(--shadow-sm)",
        "theme-md": "var(--shadow-md)",
        "theme-lg": "var(--shadow-lg)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        card: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)"
      },
      animation: {
        shimmer: "shimmer 2s infinite linear"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      }
    }
  },
  plugins: []
};
