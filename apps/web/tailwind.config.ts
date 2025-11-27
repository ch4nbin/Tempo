import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tempo: {
          bg: '#0a0c10',
          surface: '#0d1117',
          border: '#21262d',
          accent: '#2f81f7',
          'accent-dim': '#1f6feb',
          'accent-glow': 'rgba(47, 129, 247, 0.4)',
          text: '#e6edf3',
          'text-muted': '#7d8590',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config

