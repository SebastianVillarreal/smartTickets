/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(220 20% 90%)',
        input: 'hsl(220 20% 90%)',
        ring: 'hsl(215 80% 42%)',
        background: 'hsl(210 25% 98%)',
        foreground: 'hsl(220 18% 14%)',
        primary: {
          DEFAULT: 'hsl(214 84% 40%)',
          foreground: 'white',
        },
        secondary: {
          DEFAULT: 'hsl(210 25% 92%)',
          foreground: 'hsl(220 18% 14%)',
        },
        muted: {
          DEFAULT: 'hsl(210 25% 94%)',
          foreground: 'hsl(220 10% 40%)',
        },
        accent: {
          DEFAULT: 'hsl(190 65% 45%)',
          foreground: 'white',
        },
        card: {
          DEFAULT: 'white',
          foreground: 'hsl(220 18% 14%)',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15,23,42,0.08)'
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};
