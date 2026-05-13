/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ice: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A"
        },
        forest: {
          700: "#065F46",
          800: "#064E3B",
          900: "#022C22"
        },
        petrol: {
          700: "#155E75",
          800: "#083344",
          900: "#082F49"
        },
        danger: {
          100: "#FEE2E2",
          500: "#EF4444",
          700: "#B91C1C"
        },
        warning: {
          100: "#FEF3C7",
          600: "#D97706"
        },
        success: {
          100: "#DCFCE7",
          600: "#16A34A"
        }
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 16px 40px -24px rgba(15, 23, 42, 0.24)",
        panel: "0 10px 30px -18px rgba(8, 51, 68, 0.25)"
      },
      borderRadius: {
        "2xl": "1.5rem"
      }
    }
  },
  plugins: [],
};
