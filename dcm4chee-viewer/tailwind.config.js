/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['var( system-ui, Avenir, Helvetica, Arial)', 'sans-serif'],
      },
    },  },
  plugins: [],
}