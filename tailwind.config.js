/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tiktok: {
          black: '#000000',
          cyan: '#00F2EA',
          pink: '#FF0050',
          gray: '#161823',
        }
      }
    },
  },
  plugins: [],
}
