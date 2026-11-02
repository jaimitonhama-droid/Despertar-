/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        azul: "#101B32",
        dourado: "#F4C542",
        branco: "#F8FAFC",
        cinza: "#1E293B",
        borda: "#E2E8F0",
        verde: "#16A34A",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeSlideUp 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

