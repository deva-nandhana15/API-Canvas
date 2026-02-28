/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // No custom colors — using only standard Tailwind palette:
      // bg-gray-900  → primary background
      // bg-gray-800  → panels, sidebar, cards, navbar
      // bg-gray-700  → inputs, dropdowns
      // text-gray-50 → primary text
      // text-gray-400 → secondary text
      // text-gray-500 → placeholders
      // border-gray-700 → all borders
      // bg-green-600 → buttons, active states, accents
      // hover:bg-green-700 → button hovers
      // text-green-500 → highlights, active nav, focus states
      // focus:border-green-600 → input focus borders
    },
  },
  plugins: [],
}