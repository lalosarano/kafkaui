import type { Config } from "tailwindcss";

const tokenColor = (name: string) => `var(--${name})`;

const colors = [
  "bg", "bg-2", "bg-3", "bg-hover", "bg-active",
  "surface", "surface-2",
  "border", "border-2", "border-soft",
  "fg", "fg-2", "fg-3", "fg-4",
  "accent", "accent-2", "accent-bg", "accent-soft", "accent-fg",
  "green", "green-bg", "amber", "amber-bg", "red", "red-bg", "violet", "violet-bg",
].reduce<Record<string, string>>((acc, k) => {
  acc[k] = tokenColor(k);
  return acc;
}, {});

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      borderRadius: { 1: "4px", 2: "6px", 3: "8px", 4: "10px" },
      keyframes: {
        "tail-in": {
          from: { backgroundColor: "color-mix(in oklab, var(--accent) 18%, transparent)" },
          to: { backgroundColor: "transparent" },
        },
        flash: { from: { color: "var(--accent)" }, to: { color: "inherit" } },
        skeleton: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        "soft-pulse": { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.35" } },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(2px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "tail-in": "tail-in 1100ms ease-out",
        flash: "flash 700ms ease-out",
        skeleton: "skeleton 1.4s linear infinite",
        "soft-pulse": "soft-pulse 2.4s ease-in-out infinite",
        "fade-in": "fade-in 160ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
