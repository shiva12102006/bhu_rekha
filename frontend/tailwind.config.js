/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#eef6f0",
          100: "#d7ebdc",
          200: "#aed7b9",
          300: "#7fbd93",
          400: "#4f9c6c",
          500: "#2f7d4f",
          600: "#1f633e",
          700: "#1a4f33",
          800: "#153f29",
          900: "#0f2e1e",
        },
        slate: {
          50: "#f6f7f8",
          100: "#eceef1",
          200: "#d7dbe0",
          300: "#b3bac2",
          400: "#8b939e",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#0f1620",
        },
        saffron: "#e8a33d",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-tiro)", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 22, 32, 0.06), 0 1px 3px rgba(15, 22, 32, 0.08)",
      },
    },
  },
  plugins: [],
};
