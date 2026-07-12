import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Beacon warm palette — 90% neutrals, 10% amber.
        cream: "#FAF6EF", // background base
        sand: "#F1E9DB", // surface / cards
        "sand-2": "#EDE3D2", // slightly deeper surface
        beige: "#E3D7C3", // border / dividers
        charcoal: "#2C2822", // primary text
        taupe: "#7A7060", // secondary text
        amber: {
          DEFAULT: "#C99450", // accent
          soft: "#E8C892",
          deep: "#A9762F", // hover / pressed
        },
        sage: "#7C8B6B", // success / good match
      },
      fontFamily: {
        sans: ['"Inter Variable"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ['"Inter Tight Variable"', '"Inter Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 8px 24px rgba(44,40,34,0.06)",
        "card-hover": "0 14px 40px rgba(44,40,34,0.10)",
        sheet: "-24px 0 60px rgba(44,40,34,0.18)",
        glow: "0 0 60px rgba(201,148,80,0.35)",
      },
      transitionTimingFunction: {
        physical: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "chip-in": {
          "0%": { opacity: "0", transform: "translateY(6px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.55", transform: "scale(0.98)" },
          "50%": { opacity: "0.85", transform: "scale(1.03)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s cubic-bezier(0.4,0,0.2,1) both",
        "fade-in": "fade-in 0.5s cubic-bezier(0.4,0,0.2,1) both",
        "chip-in": "chip-in 0.4s cubic-bezier(0.4,0,0.2,1) both",
        breathe: "breathe 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
