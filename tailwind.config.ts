import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12211A',
        leaf: { DEFAULT: '#136B4B', dark: '#0D4E37', light: '#E4F0E8' },
        gold: { DEFAULT: '#E4A11B', light: '#FBF0D8' },
        clay: { DEFAULT: '#B4531F', light: '#F9EBE1' },
        paper: '#F2F5F1',
        line: '#DDE5DC',
        muted: '#5F6F63',
        whatsapp: '#1FA855',
      },
      fontFamily: { num: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'] },
      borderRadius: { card: '14px' },
    },
  },
  plugins: [],
} satisfies Config;
