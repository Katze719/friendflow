/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Inter",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#f4f7ff",
          100: "#e6edff",
          200: "#c9d6ff",
          300: "#a4b8ff",
          400: "#7b93ff",
          500: "#5b74ff",
          600: "#4558ef",
          700: "#3644c4",
          800: "#2c379a",
          900: "#222a74",
        },
      },
      keyframes: {
        "typewriter-caret": {
          "0%, 45%": { opacity: "1" },
          "55%, 100%": { opacity: "0" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-slower": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(3deg)" },
        },
        "drift-blob": {
          "0%, 100%": { transform: "translateX(-50%) translateY(0) rotate(0deg) scale(1)" },
          "33%": { transform: "translateX(-50%) translateY(-10px) rotate(4deg) scale(1.03)" },
          "66%": { transform: "translateX(-50%) translateY(6px) rotate(-3deg) scale(0.98)" },
        },
        "drift-soft": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(6px, -6px) scale(1.04)" },
        },
        shimmer: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "draw-in": {
          "0%": { strokeDashoffset: "1" },
          "100%": { strokeDashoffset: "0" },
        },
        "pulse-dot": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.35)", opacity: "0.55" },
        },
        "ping-ring": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        "typewriter-caret": "typewriter-caret 1s steps(1, end) infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "float-slower": "float-slower 9s ease-in-out infinite",
        "drift-blob": "drift-blob 18s ease-in-out infinite",
        "drift-soft": "drift-soft 14s ease-in-out infinite",
        shimmer: "shimmer 6s ease-in-out infinite",
        "draw-in": "draw-in 1.2s ease-out forwards",
        "pulse-dot": "pulse-dot 1.8s ease-in-out infinite",
        "ping-ring": "ping-ring 1.8s cubic-bezier(0,0,0.2,1) infinite",
      },
    },
  },
  plugins: [],
};
