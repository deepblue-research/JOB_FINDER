/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Hanken Grotesk', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#f6f9ff',
        primary: { DEFAULT: '#2563eb', dark: '#1e40af' },
        brand: '#1e293b',
        mid: '#475569',
        muted: '#64748b',
        faint: '#94a3b8',
        success: '#059669',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
