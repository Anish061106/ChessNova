/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        nova: {
          cyan: '#38bdf8',
          purple: '#8b5cf6',
          violet: '#a855f7',
          glow: '#6366f1',
        },
        dark: {
          bg: '#080c16',
          card: '#0f172a',
          surface: '#131e36',
          border: '#1e293b',
          borderHover: '#334155',
          text: '#f8fafc',
          textMuted: '#94a3b8',
        },
        light: {
          bg: '#f8fafc',
          card: '#ffffff',
          surface: '#f1f5f9',
          border: '#e2e8f0',
          borderHover: '#cbd5e1',
          text: '#0f172a',
          textMuted: '#64748b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'nova-sm': '0 0 15px -3px rgba(99, 102, 241, 0.25)',
        'nova': '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        'nova-cyan': '0 0 25px -5px rgba(56, 189, 248, 0.35)',
      }
    },
  },
  plugins: [],
}
