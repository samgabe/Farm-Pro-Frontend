/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        farm: {
          bg: '#efede6',
          panel: '#f8f6f2',
          green: '#3f6641',
          gold: '#d3a94d',
          orange: '#c57d56',
          red: '#be4b3a'
        }
      }
    }
  },
  plugins: []
}
