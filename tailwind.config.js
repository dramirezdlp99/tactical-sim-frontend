/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#000000",
        "secondary": "#4059aa",
        "background": "#f8f9ff",
        "surface": "#f8f9ff",
        "surface-container": "#e5eeff",
        "surface-container-low": "#eff4ff",
        "surface-container-lowest": "#ffffff",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#45464d",
        "error": "#ba1a1a",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}