import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d9f1ff',
          200: '#bce8ff',
          300: '#8fd9ff',
          400: '#57c1ff',
          500: '#20a0fc',
          600: '#168bfa',
          700: '#1677f8',
          800: '#1264d6',
          900: '#1453a7'
        }
      },
      boxShadow: {
        soft: '0 14px 40px rgba(22, 119, 248, 0.10)',
        brand: '0 10px 28px rgba(22, 119, 248, 0.22)'
      }
    }
  },
  plugins: [],
} satisfies Config;
