/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lavender: {
          50: '#FAF8FF',
          100: '#F5F3FF', // Background #F5F3FF
          200: '#E9E2FF', // Soft highlights #E9E2FF
          300: '#D9CFFF',
          400: '#B5A5E5',
          500: '#8B78C6', // Accent #8B78C6
          600: '#7865B3', // Hover
          700: '#64529E',
          800: '#4D3E7B',
          900: '#302B43', // Text #302B43
          950: '#201C30',
          bg: '#F5F3FF',
          card: '#FFFFFF',
          accent: '#8B78C6',
          accentHover: '#7865B3',
          highlight: '#E9E2FF',
          text: '#302B43',
          textMuted: '#6A6282',
          border: '#E7E2F0',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
