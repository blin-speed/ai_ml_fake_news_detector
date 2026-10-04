/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FAF7F2",
          surface: "#FFFFFF",
          card: "#F4EFEA",
          border: "#E7E1D8",
          darker: "#DDD6CB",
        },
        ink: {
          DEFAULT: "#1B1B1F",
          muted: "#4A4D57",
          subtle: "#6B7280",
          faint: "#9CA3AF",
        },
        reliable: {
          DEFAULT: "#2A9D8F",
          light: "#E8F5F3",
          dark: "#1F7A6F",
          border: "#A3D9D2",
        },
        questionable: {
          DEFAULT: "#C25E00",
          light: "#FDF2E9",
          dark: "#9E4D00",
          border: "#F5C299",
        },
        neutralBand: {
          DEFAULT: "#5C6479",
          light: "#EFF1F6",
          dark: "#454B5C",
          border: "#C8CDDB",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
