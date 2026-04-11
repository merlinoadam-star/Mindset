/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9ebff",
          200: "#bcdcff",
          300: "#8ec4ff",
          400: "#59a2ff",
          500: "#337dff",
          600: "#1f5ff0",
          700: "#1948d1",
          800: "#1b3ea6",
          900: "#1c3882",
        },
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pop-in": "popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      keyframes: {
        popIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}
