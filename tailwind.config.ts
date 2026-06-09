import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111114",
        offer: "#9d2b2b",
        placeholder: "#9a9a9a",
        panel: "#f4f4f4",
        line: "#e7e7e3",
        surface: "#ffffff",
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,17,20,0.04), 0 8px 24px -16px rgba(17,17,20,0.25)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        brand: ["var(--font-oswald)", "var(--font-inter)", "sans-serif"],
      },
      fontWeight: {
        "400": "400",
        "500": "500",
        "600": "600",
        "700": "700",
      },
    },
  },
  plugins: [],
};

export default config;
