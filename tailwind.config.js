/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Manrope"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0E1712',
          900: '#141F19',
          800: '#1B2822',
          700: '#24352C',
        },
        canvas: {
          50: '#F7F8F3',
          100: '#F1F3EC',
        },
        moss: {
          50: '#EAF3EC',
          100: '#CFE6D6',
          300: '#7FB894',
          500: '#2F8258',
          600: '#236B47',
          700: '#1B5538',
        },
        gold: {
          400: '#D9B25D',
          500: '#C9A24B',
          600: '#AD8534',
        },
        clay: {
          400: '#E08772',
          500: '#D2604A',
          600: '#B14C39',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(14,23,18,0.04), 0 8px 24px -12px rgba(14,23,18,0.12)',
        card: '0 1px 1px rgba(14,23,18,0.03), 0 12px 32px -16px rgba(14,23,18,0.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
