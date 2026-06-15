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
        background: "#EDF5FF",
        surface: "#FFFFFF",
        "surface-2": "#F0F7FF",
        border: "#BDD4EC",
        "border-light": "#D4E6F5",
        primary: {
          DEFAULT: "#4A9FD8",
          light: "#6DB8E8",
          dark: "#2E7DB5",
        },
        accent: {
          DEFAULT: "#E891B0",
          light: "#F4A8C5",
        },
        focused: "#3CB48A",
        distracted: "#E8A020",
        impulsive: "#E86060",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-sky":
          "linear-gradient(160deg, #CCEAFF 0%, #EDF5FF 50%, #FFF0F7 100%)",
        "card-soft":
          "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,247,255,0.7))",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        float: "float 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.5s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
