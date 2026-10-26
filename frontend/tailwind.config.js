/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0f9fa',
          100: '#d7eff2',
          200: '#b4e1e6',
          300: '#84cdd5',
          400: '#4fb0bd',
          500: '#2f91a0',
          600: '#267683',
          700: '#235f6a',
          800: '#22505a', // Matches the exact muted teal sidebar
          900: '#1b4048',
          950: '#0e272d',
        },
        slatebg: '#f4f7f8',
        cardborder: '#e2e9ec',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
