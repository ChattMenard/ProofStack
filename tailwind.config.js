module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark natural theme
        forest: {
          50: '#e8ebe9',
          100: '#d1d7d3',
          200: '#b8c0bb',
          300: '#9ea9a3',
          400: '#85918b',
          500: '#6b7a73',
          600: '#5a675f',
          700: '#49544b',
          800: '#364039',
          900: '#2d3331',
          950: '#1a1f1e',
        },
        sage: {
          50: '#f2f5f3',
          100: '#d8e3d9',
          200: '#bcd0be',
          300: '#a0bea3',
          400: '#8ba888',
          500: '#6b8e6e',
          600: '#587559',
          700: '#465c47',
          800: '#354435',
          900: '#243024',
        },
        earth: {
          50: '#f5f0ec',
          100: '#e6d9d0',
          200: '#d4c0b0',
          300: '#c2a790',
          400: '#b08e70',
          500: '#a98467',
          600: '#8a6a52',
          700: '#6b503e',
          800: '#4d362a',
          900: '#2e1c16',
        }
      },
      animation: {
        'gradient': 'gradient 8s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 3s infinite',
        'fade-in': 'fade-in 0.6s ease-out forwards',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    }
  },
  plugins: []
}
