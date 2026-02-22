/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading:   ['Syne', 'sans-serif'],
        body:      ['DM Sans', 'sans-serif'],
        malayalam: ['Noto Sans Malayalam', 'sans-serif'],
      },
      colors: {
        orange:  { DEFAULT: '#E8751A', light: '#F97316' },
        yellow:  '#F5C842',
        cream:   { DEFAULT: '#FDFAF4', dark: '#F5EFE0' },
        brown:   '#7C4A1E',
        green:   { DEFAULT: '#1B4332', light: '#D1FAE5', dark: '#065F46' },
        muted:   '#7A7060',
        'border-warm': '#E8DDD0',
        red:     { DEFAULT: '#DC2626', light: '#FEF2F2', dark: '#991B1B' },
        amber:   { DEFAULT: '#F59E0B', light: '#FEF3C7', dark: '#92400E' },
      },
      borderRadius: {
        pill:  '100px',
        card:  '20px',
        input: '12px',
      },
      boxShadow: {
        card:         '0 2px 16px rgba(0,0,0,0.07)',
        'card-hover': '0 8px 28px rgba(0,0,0,0.10)',
        'orange-glow':'0 10px 28px rgba(232,117,26,0.35)',
        modal:        '0 20px 60px rgba(0,0,0,0.2)',
        phone:        '0 32px 80px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}