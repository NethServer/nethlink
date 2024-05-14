/** @type {import('tailwindcss').Config} */

// const colors = {
//   'gray-950': '#030712',
//   'gray-900': '#111827',
//   'gray-700': '#374151',
//   'gray-800': '#1f2937',
//   'gray-600': '#4B5563',
//   'gray-500': '#6B7280',
//   'gray-400': '#9CA3AF',
//   'gray-300': '#D1D5DB',
//   'gray-200': '#E5E7EB',
//   'gray-100': '#f3f4f6',
//   'gray-50': '#F9FAFB',
//   'blue-600': '#1D4ED8',
//   'blue-500': '#3B82F6',
//   'red-600': '#DC2626',
//   'green-700': '#15803D'
// }
export default {
  content: [
    './src/renderer/index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@nethesis/phone_island/**/*.{js,jsx,ts,tsx}'
  ],
  //darkMode: 'class',
  theme: {
    extend: {
      colors: {
        //borders
        borderDark: '#374151', //gray-700
        borderLight: '#E5E7EB', //gray-200

        // primaryFocus: '#3b82f6', // blue-500
        // primaryLighter: '#1d4ed8', // blue-700

        // primaryLight: '#10b981', // emerald-500

        // primaryDarkFocus: '#bfdbfe', // blue-200
        // primaryDarker: '#3b82f6', // blue-500

        //primary
        primary: '#1d4ed8', // blue-700
        primaryHover: '#1e40af', // blue-800
        primaryRing: '#3b82f6', // blue-500

        //primary dark
        primaryDark: '#3b82f6', // blue-500
        primaryDarkHover: '#93c5fd', // blue-300
        primaryRingDark: '#bfdbfe', // blue-200

        //text
        titleLight: '#111827', // gray-900
        titleDark: '#F9FAFB', // gray-50

        //blue text
        textBlueLight: '#1d4ed8', //blue-700
        textBlueDark: '#3b82f6', // blue-500

        //amber icon
        iconAmberLight: '#b45309', //amber-700
        iconAmberDark: '#fef3c7', // amber-100

        //buttonPrimary
        primaryButtonText: '#fff', // white
        primaryButtonTextDark: '#030712', // gray-950

        //input
        bgInput: '#fff', // white
        inputText: '#111827', // gray-900
        inputLabelTitle: '#111827', // gray-900
        placeHolderInputText: '#111827', // gray-900
        inputIcon: '#374151', // gray-700

        //input dark
        bgInputDark: '#030712', // gray-950
        inputTextDark: '#F9FAFB', // gray-50
        inputLabelTitleDark: '#F9FAFB', // gray-50
        placeHolderInputTextDark: '#F9FAFB', // gray-50
        inputIconDark: '#F9FAFB', // gray-50

        //loadingSpinnerBackground
        spinnerBgLight: '#f9fafb', // gray-50
        spinnerBgDark: '#030712', // gray-950

        //background
        bgLight: '#f9fafb', // gray-50
        bgDark: '#111827', // gray-900

        //modal
        bgAmberLight: '#fef3c7', //amber-100
        bgAmberDark: '#b45309', //amber-700

        //hover
        hoverDark: '#1f2937', // gray-800
        hoverLight: '#E5E7EB', // gray-200

        //ring
        ringBlueDark: '#bfdbfe', // blue-200
        ringBlueLight: '#3b82f6', // blue-500

        //ring-offset
        ringOffsetDark: '#111827', // gray-900
        ringOffsetLight: '#F9FAFB' // gray-50
        //
      },
      screens: {
        '3xl': '1792px',
        '4xl': '2048px',
        '5xl': '2560px',
        '6xl': '3072px',
        '7xl': '3584px'
      },
      fontFamily: {
        Poppins: ['Poppins', 'sans-serif']
      }
    }
  },
  plugins: [require('@tailwindcss/forms')],
  darkMode: 'selector'
}
