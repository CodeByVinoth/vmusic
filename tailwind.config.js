/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'accent-primary': '#1db954', // Spotify Green
        'accent-secondary': '#1ed760',
        'bg-base': '#000000',
        'bg-elevated': '#121212',
        'bg-highlight': '#282828',
        'bg-press': '#000000',
        'text-main': '#ffffff',
        'text-secondary': '#b3b3b3',
      },
      spacing: {
        'sidebar': '240px',
        'player-height': '90px',
      },
      borderRadius: {
        'spotify': '4px',
      },
      fontSize: {
        'xxs': '11px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slide-in 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
