import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        fedha: {
          navy: '#0B1F3A',
          navyLight: '#132A4D',
          gold: '#C9A24B',
          green: '#1E8E5A',
          red: '#C0392B',
          amber: '#D69E2E',
        },
      },
    },
  },
  plugins: [],
};
export default config;
