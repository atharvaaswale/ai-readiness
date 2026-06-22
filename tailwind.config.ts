import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        score: {
          excellent: '#22c55e',
          good: '#84cc16',
          fair: '#eab308',
          poor: '#f97316',
          critical: '#ef4444',
        },
      },
      animation: {
        'gauge-fill': 'gauge-fill 1s ease-out forwards',
      },
      keyframes: {
        'gauge-fill': {
          '0%': { strokeDashoffset: '283' },
          '100%': { strokeDashoffset: 'var(--target-offset)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
