import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          0: '#06070b',
          1: '#0a0c12',
          2: '#0f1118',
          3: '#161922',
          4: '#1d2030',
          5: '#25293a',
        },
        line: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          2: 'rgba(255,255,255,0.08)',
          3: 'rgba(255,255,255,0.14)',
        },
        ink: {
          DEFAULT: '#f0eee8',
          2: '#b8b5ac',
          3: '#6e6b62',
          4: '#44423c',
        },
        violet: {
          DEFAULT: '#b794f6',
          soft: '#d4bdfa',
          deep: '#7c5cd1',
        },
        cyan: {
          DEFAULT: '#6ee7d4',
          soft: '#a4f3e2',
          deep: '#2fb89c',
        },
        gold: {
          DEFAULT: '#d4b87a',
          soft: '#e8d59e',
          deep: '#9a8147',
        },
        warn: '#d4924a',
        calm: '#6ee7d4',
        alert: '#f87171',
        neutral2: '#a8a4f3',
      },
      fontFamily: {
        sans: ['var(--font-vazir)', 'sans-serif'],
        serif: ['var(--font-instrument)', 'serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-geist)', 'sans-serif'],
      },
      boxShadow: {
        'soft-1': '0 1px 2px rgba(0,0,0,0.5)',
        'soft-2': '0 4px 16px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)',
        'soft-3': '0 8px 32px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4)',
        'soft-4': '0 24px 64px rgba(0,0,0,0.7), 0 8px 16px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'gradient-violet': 'linear-gradient(135deg, #b794f6, #7c5cd1)',
        'gradient-cyan': 'linear-gradient(135deg, #6ee7d4, #2fb89c)',
        'gradient-gold': 'linear-gradient(135deg, #d4b87a, #9a8147)',
        'gradient-conic': 'conic-gradient(from 220deg at 50% 50%, #b794f6, #6ee7d4, #b794f6, #6ee7d4)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s ease-out backwards',
      },
      keyframes: {
        'pulse-soft': {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.85)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
