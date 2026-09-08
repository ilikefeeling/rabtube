/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'DM Sans', 'sans-serif'],
        serif: ['var(--font-serif)', 'DM Serif Display', 'serif'],
      },
    },
  },
  plugins: [],
};
