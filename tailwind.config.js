/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: '#12263a',
        paper: '#f6f4ee',
        draft: {
          DEFAULT: '#b8860b',
          soft: '#c9a227',
        },
        blueprint: {
          50: '#eef4fb',
          100: '#dbe8f6',
          200: '#b7d0ec',
          300: '#8bb2de',
          400: '#5b8dcb',
          500: '#356db2',
          600: '#265492',
          700: '#1f4374',
          800: '#1c3a60',
          900: '#132840',
        },
      },
      keyframes: {
        'bp-scan': {
          '0%': { transform: 'translateY(-120%)', opacity: '0' },
          '15%': { opacity: '1' },
          '85%': { opacity: '1' },
          '100%': { transform: 'translateY(2400%)', opacity: '0' },
        },
        'bp-dash': {
          to: { 'stroke-dashoffset': '-16' },
        },
        'bp-pulse': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.9' },
        },
      },
      animation: {
        'bp-scan': 'bp-scan 1.9s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bp-dash': 'bp-dash 1s linear infinite',
        'bp-pulse': 'bp-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
