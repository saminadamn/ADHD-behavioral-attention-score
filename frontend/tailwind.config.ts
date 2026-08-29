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
        background:      "#FCFBFF",
        surface:         "#FFFFFF",
        "surface-2":     "#F5F2FF",
        border:          "#E7E0F3",
        "border-strong": "#D4C9EB",
        text: {
          DEFAULT: "#2D2438",
          muted:   "#6E617D",
          subtle:  "#9D90AC",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          light:   "#EDE9FE",
          dark:    "#7C3AED",
        },
        focused:    "#7C9A6D",
        distracted: "#C08457",
        impulsive:  "#B4534D",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      maxWidth: {
        content: "780px",
        wide:    "1060px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(45,36,56,0.06), 0 1px 2px rgba(45,36,56,0.04)",
        "card-hover": "0 4px 12px rgba(45,36,56,0.10), 0 1px 4px rgba(45,36,56,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
