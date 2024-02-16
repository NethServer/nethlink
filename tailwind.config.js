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
        'red-600': '#DC2626',
        primary: '#047857', // emerald-700
        primaryHover: '#065f46', // emerald-800
        primaryFocus: '#10b981', // emerald-500
        primaryLighter: '#ecfdf5', // emerald-100
        primaryLight: '#10b981', // emerald-500
        primaryDark: '#10b981', // emerald-500
        primaryDarkHover: '#6ee7b7', // emerald-300
        primaryDarkFocus: '#a7f3d0', // emerald-200
        primaryDarker: '#064e3b' // emerald-900
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
