/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./*.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // small phones still deserve a labelled call to action
      screens: { xs: '380px' },
      colors: {
        // ── mobile UI layer ────────────────────────────────────────────────
        // The chrome over the game uses its own small palette: one orange
        // accent, dark blue-greys for floating controls, white/greys for
        // sheets. The world keeps its district colours for wayfinding.
        brand: {
          DEFAULT: '#ff6b1a',
          soft: '#ff832f',
          deep: '#e85c10',
        },
        ink: {
          900: '#0b1220',
          800: '#111a28',
          700: '#182434',
          600: '#22304380',
          line: '#2b3b50',
        },
        paper: {
          DEFAULT: '#ffffff',
          50: '#f6f8fb',
          100: '#eef2f7',
          200: '#dde4ee',
          muted: '#6b7a90',
        },

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
      spacing: {
        'safe-t': 'env(safe-area-inset-top, 0px)',
        'safe-b': 'env(safe-area-inset-bottom, 0px)',
        'safe-s': 'env(safe-area-inset-left, 0px)',
        'safe-e': 'env(safe-area-inset-right, 0px)',
      },
      boxShadow: {
        chip: '0 4px 14px rgba(0,0,0,0.35)',
        sheet: '0 -12px 40px rgba(0,0,0,0.45)',
        fab: '0 8px 24px rgba(255,107,26,0.38)',
        // the city is a model under daylight, so its chrome is white cards
        // rather than dark glass: a short contact shadow plus a wide soft one
        card: '0 1px 2px rgba(20,36,58,0.08), 0 8px 22px rgba(20,36,58,0.14)',
        'card-lg': '0 2px 6px rgba(20,36,58,0.08), 0 -10px 36px rgba(20,36,58,0.18)',
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
        'sheet-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
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
        'sheet-up': 'sheet-up 0.26s cubic-bezier(0.22, 1, 0.36, 1)',
        'coin-fly': 'coin-fly 0.9s ease-out forwards',
        bob: 'bob 2.4s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
      },
    },
  },
  plugins: [],
};
