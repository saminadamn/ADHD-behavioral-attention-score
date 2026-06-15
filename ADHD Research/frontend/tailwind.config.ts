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
        background: "#0A0A0F",
        surface: "#12121A",
        "surface-2": "#1A1A28",
        border: "#1E1E30",
        "border-light": "#2A2A40",
        primary: {
          DEFAULT: "#7C3AED",
          light: "#9F67FF",
          dark: "#5B21B6",
        },
        accent: {
          DEFAULT: "#06B6D4",
          light: "#22D3EE",
        },
        focused: "#10B981",
        distracted: "#F59E0B",
        impulsive: "#EF4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.35), transparent)",
        "card-glass":
          "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        glow: {
          from: { boxShadow: "0 0 20px rgba(124,58,237,0.3)" },
          to: { boxShadow: "0 0 40px rgba(124,58,237,0.6)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
