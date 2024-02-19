/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@nethesis/react-components/**/*.{js,jsx,ts,tsx}',
    './node_modules/@nethesis/phone_island/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'gray-950': '#030712',
        'gray-900': '#111827',
        'gray-700': '#374151',
        'gray-500': '#6B7280',
        'gray-400': '#9CA3AF',
        'gray-300': '#D1D5DB',
        'gray-200': '#E5E7EB',
        'gray-50': '#F9FAFB',
        'blue-500': '#3B82F6',
        'red-600': '#DC2626'
      },
      screens: {
        '3xl': '1792px',
        '4xl': '2048px',
        '5xl': '2560px',
        '6xl': '3072px',
        '7xl': '3584px'
      }
    }
  },

  plugins: []
}
