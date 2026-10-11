/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        banana: {
          50: '#FFFDE7',
          100: '#FFF9C4',
          200: '#FFF59D',
          300: '#FFF176',
          400: '#FDD835',
          500: '#FBC02D',
          600: '#F9A825',
        },
        cream: {
          50: '#FFFDF5',
          100: '#FFFBF0',
          200: '#FFF6D6',
        },
        ink: {
          DEFAULT: '#191A17',
          light: '#2E302B',
          muted: '#63655D',
        },
        vine: {
          100: '#E1EFEA',
          200: '#B8D8D0',
          500: '#2C7466',
          600: '#1F5C50',
        },
        ripe: '#E2542A',
      },
      boxShadow: {
        'retro-sm': '2px 2px 0px #191A17',
        'retro': '3.5px 3.5px 0px #191A17',
        'retro-lg': '5px 5px 0px #191A17',
        'retro-xl': '7px 7px 0px #191A17',
      }
    },
  },
  plugins: [],
}
