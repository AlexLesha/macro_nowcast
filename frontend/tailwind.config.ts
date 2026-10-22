import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        macro: {
          dark: "#0b0f17",
          card: "#111827",
          border: "#1f293d",
          muted: "#94a3b8",
          bullish: "#10b981",
          bearish: "#f43f5e",
          neutral: "#f59e0b",
          cyan: "#06b6d4",
          violet: "#8b5cf6",
        },
      },
    },
  },
  plugins: [],
};
export default config;
