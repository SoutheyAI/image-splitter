/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ["InterVariable", "Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Light theme colors
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        // Dark theme colors
        dark: {
          bg: "#1a1a1a",
          text: "#ffffff",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
