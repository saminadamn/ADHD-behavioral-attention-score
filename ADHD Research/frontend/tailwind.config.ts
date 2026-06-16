import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background:      "#FFFFFF",
        surface:         "#F9FAFB",
        "surface-2":     "#F3F4F6",
        border:          "#E5E7EB",
        "border-strong": "#D1D5DB",
        text: {
          DEFAULT: "#111827",
          muted:   "#6B7280",
          subtle:  "#9CA3AF",
        },
        accent: {
          DEFAULT: "#2563EB",
          muted:   "#DBEAFE",
          dark:    "#1D4ED8",
        },
        focused:    "#16A34A",
        distracted: "#B45309",
        impulsive:  "#DC2626",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      maxWidth: {
        content: "780px",
        wide:    "1060px",
      },
    },
  },
  plugins: [],
};
export default config;
