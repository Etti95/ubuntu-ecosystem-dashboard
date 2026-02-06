import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ubuntu: {
          orange: '#E95420',
          'orange-dark': '#C7401A',
          aubergine: '#772953',
          'warm-grey': '#AEA79F',
          'cool-grey': '#333333',
        },
      },
    },
  },
  plugins: [],
}
export default config
