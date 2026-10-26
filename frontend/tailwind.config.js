/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glacier: {
          DEFAULT: '#BFE9FF',
          50: '#F5FBFF',
          100: '#EAF8FF',
          200: '#D5F1FF',
          300: '#BFE9FF',
          400: '#94D9FF',
          500: '#68C8FF',
          600: '#3DB8FF',
          700: '#12A7FF',
          800: '#008CE0',
          900: '#006DB0',
        },
        ultraviolet: {
          DEFAULT: '#6F3DFF',
          50: '#F8F6FF',
          100: '#F0EBFF',
          200: '#E1D6FF',
          300: '#C7B3FF',
          400: '#A485FF',
          500: '#865EFF',
          600: '#6F3DFF',
          700: '#5A2CE3',
          800: '#4922C7',
          900: '#3B1A9E',
          950: '#230E66',
        },
        mineral: {
          DEFAULT: '#B7B7B7',
          50: '#FAFAFB',
          100: '#F2F3F5',
          200: '#E3E5EC',
          300: '#CDD0D8',
          400: '#B7B7B7',
          500: '#9A9CA6',
          600: '#7E808C',
          700: '#686B7A',
          800: '#484A54',
          900: '#2C2D34',
        },
        softbg: '#F7F8FC',
        surface: '#FFFFFF',
        textprimary: '#171827',
        textsecondary: '#686B7A',
        cardborder: '#E3E5EC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(23, 24, 39, 0.05), 0 1px 2px -1px rgba(23, 24, 39, 0.05)',
        'premium': '0 4px 12px -2px rgba(23, 24, 39, 0.06), 0 2px 6px -2px rgba(23, 24, 39, 0.04)',
        'glow-purple': '0 0 15px -3px rgba(111, 61, 255, 0.25)',
      }
    },
  },
  plugins: [],
}
