/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff', 100: '#e0effe', 200: '#bae0fd', 300: '#7cc7fc',
          400: '#36a8f8', 500: '#0c8de8', 600: '#006fc6', 700: '#0159a1',
          800: '#064c85', 900: '#0b406d', 950: '#07274a',
        },
        accent: {
          50: '#fff8f3', 100: '#feecdc', 200: '#fcd8b6', 300: '#f9bb87',
          400: '#f59354', 500: '#f3742f', 600: '#e4571f', 700: '#bd411a',
          800: '#98361b', 900: '#7a2f1a', 950: '#411509',
        },
        success: {
          50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
        },
        warning: {
          50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
        },
        error: {
          50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
        },
        paper: '#fbf7f0',
        espresso: {
          50: '#f6f1ec', 100: '#e9ddd1', 200: '#d3bfa8', 300: '#b89a7d',
          400: '#9c785a', 500: '#82603f', 600: '#684a30', 700: '#513a26',
          800: '#3a2a1c', 900: '#251b13', 950: '#150f0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      boxShadow: {
        book: '0 24px 48px -18px rgba(37,27,19,0.35), 0 4px 12px -6px rgba(37,27,19,0.15)',
        'book-sm': '0 12px 24px -12px rgba(37,27,19,0.25)',
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
