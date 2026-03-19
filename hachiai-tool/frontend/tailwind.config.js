/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hachiai: {
          purple: '#8E65A4',
          'purple-dark': '#6A407D',
          'purple-light': '#D1BDE0',
          grey: '#444444',
        }
      }
    },
  },
  plugins: [],
}
