/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f5f1',
          100: '#e4e7e0',
          200: '#cbd1c4',
          300: '#aab4a1',
          400: '#85927a',
          500: '#67755a',
          600: '#4f5c44',
          700: '#404a37',
          800: '#343c2e',
          900: '#2b3227',
        },
        deepblack: '#0a0a0a'
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}