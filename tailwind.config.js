/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#44e092',
        'primary-dark': '#006d41',
        secondary: '#ffb4aa',
        tertiary: '#c1c1ff',
        gold: '#f5c542',
        surface: '#0f131c',
        'surface-bright': '#353943',
        'surface-container': '#1c1f29',
        border: '#3c4a40',
        text: '#dfe2ef',
        'text-2': '#bbcabd',
        'text-3': '#869488',
        grass: '#1b3226',
        road: '#232833',
      },
      fontFamily: {
        headline: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        body: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'coin-fly': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-60px) scale(1.4)', opacity: '0' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.22s ease-out',
        'coin-fly': 'coin-fly 0.9s ease-out forwards',
        bob: 'bob 2.4s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
      },
    },
  },
  plugins: [],
};
