import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        slateglass: {
          50: "#f7f9fb",
          100: "#edf1f5",
          200: "#d7dfe7",
          300: "#b9c5d0",
          400: "#94a4b3",
          500: "#748598",
          600: "#5a6b80",
          700: "#485567",
          800: "#3c4654",
          900: "#333b45"
        }
      }
    }
  },
  plugins: [],
};

export default config;
