/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // WhatsApp-inspired premium green palette
        brand: {
          50: "#ecfff4",
          100: "#d3fbe3",
          200: "#a8f5c7",
          300: "#6fe9a2",
          400: "#3bdc83",
          500: "#25d366", // WhatsApp green
          600: "#1aae5a",
          700: "#128c7e", // WhatsApp teal
          800: "#075e54", // WhatsApp dark teal
          900: "#054740",
          950: "#032d29",
        },
        wa: "#25d366",
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
