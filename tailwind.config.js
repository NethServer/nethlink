/** @type {import('tailwindcss').Config} */

export default {
  content: ['./src/renderer/index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // design system elevation and skeleton
        elevationL2: '#F3F4F6', // gray-100, Elevation/L2
        elevationL2Dark: '#1F2937', // gray-800
        surfaceSkeleton: '#E5E7EB', // gray-200, Surface/Skeleton
        surfaceSkeletonDark: '#374151', // gray-700

        // borders
        borderDark: '#374151', // gray-700
        borderLight: '#E5E7EB', // gray-200

        // design system surfaces
        elevationL1: '#F9FAFB', // gray-50

        // design system text
        textPrimaryNeutral: '#111827', // gray-900
        textPrimaryNeutralDark: '#F9FAFB', // gray-50
        textSecondaryNeutral: '#374151', // gray-700
        textSecondaryNeutralDark: '#E5E7EB', // gray-200

        // design system product
        productPrimaryNethlinkActive: '#1d4ed8', // blue-700
        productPrimaryNethlinkActiveDark: '#3b82f6', // blue-500

        // design system surfaces
        surfaceToggleBackgroundDisabled: '#9CA3AF', // gray-400
        surfaceToggleBackgroundDisabledDark: '#9CA3AF', // gray-400

        // primary
        primary: '#1d4ed8', // blue-700
        primaryHover: '#1e40af', // blue-800
        primaryRing: '#3b82f6', // blue-500

        // primary dark
        primaryDark: '#3b82f6', // blue-500
        primaryDarkHover: '#93c5fd', // blue-300
        primaryRingDark: '#bfdbfe', // blue-200

        // text
        titleLight: '#111827', // gray-900, Text/Primary neutral
        titleDark: '#F9FAFB', // gray-50, Text/Primary neutral

        // blue text
        textBlueLight: '#1d4ed8', // blue-700
        textBlueDark: '#3b82f6', // blue-500

        // indigo text
        textIndigoLight: '#4338CA', // indigo-700
        textIndigoDark: '#818cf8', // indigo-400

        // yellow text
        textYellowLight: '#B45309', // yellow-700
        textYellowDark: '#F59E0B', // yellow-500
        // red text
        textRedLight: '#BE123C', // red-700
        textRedDark: '#F43F5E', // red-500

        // amber icon
        iconAmberLight: '#b45309', // amber-700
        iconAmberDark: '#fef3c7', // amber-100
        iconTooltip: '#3730A3', // indigo-800, Icon/Tooltip
        iconTooltipDark: '#A5B4FC', // indigo-300

        // buttonPrimary
        primaryButtonText: '#fff', // white
        primaryButtonTextDark: '#030712', // gray-950

        // input
        bgInput: '#fff', // white
        inputText: '#111827', // gray-900
        inputLabelTitle: '#111827', // gray-900
        placeHolderInputText: '#9CA3AF', // gray-400, Text/Placeholder
        inputIcon: '#374151', // gray-700

        // input dark
        bgInputDark: '#030712', // gray-950
        inputTextDark: '#F9FAFB', // gray-50
        inputLabelTitleDark: '#F9FAFB', // gray-50
        placeHolderInputTextDark: '#6B7280', // gray-500, Text/Placeholder
        inputIconDark: '#F9FAFB', // gray-50

        // loadingSpinnerBackground
        spinnerBgLight: '#f9fafb', // gray-50
        spinnerBgDark: '#030712', // gray-950

        // background
        bgLight: '#f9fafb', // gray-50
        bgDark: '#111827', // gray-900
        bgEmerald: '#15803D', // green-700

        // modal
        bgAmberLight: '#fef3c7', // amber-100
        bgAmberDark: '#b45309', // amber-700

        // hover
        hoverDark: 'rgb(75 85 99 / 0.3)', // gray-600/30, Surface/Button/Tertiary hover
        hoverLight: 'rgb(229 231 235 / 0.7)', // gray-200/70, Surface/Button/Tertiary hover

        // ring
        ringBlueDark: '#bfdbfe', // blue-200
        ringBlueLight: '#3b82f6', // blue-500

        // ring-offset
        ringOffsetDark: '#111827', // gray-900
        ringOffsetLight: '#F9FAFB', // gray-50

        // iconEmpty
        emptyIconLight: '#9CA3AF', // gray-400
        emptyIconDark: '#6B7280', // gray-500
        // textEmpty
        emptyTextLight: '#111827', // gray-900
        emptyTextDark: '#F9FAFB', // gray-50

        surfaceToastInfo: '#E0E7FF',
        surfaceToastInfoDark: '#312E81',
        surfaceToastSuccess: '#DCFCE7',
        surfaceToastSuccessDark: '#14532D',
        surfaceToastWarning: '#FEF3C7',
        surfaceToastWarningDark: '#7C2D12',
        surfaceToastError: '#FFE4E6',
        surfaceToastErrorDark: '#7F1D1D',
        surfacePresenceBusy: '#EF4444',
        surfacePresenceBusyDark: '#EF4444',
        surfacePresenceOnline: '#22C55E',
        surfacePresenceOnlineDark: '#22C55E',
        surfacePresenceDnd: '#030712',
        surfacePresenceDndDark: '#030712',
        surfacePresenceOffline: '#6B7280',
        surfacePresenceOfflineDark: '#6B7280',
      },
      screens: {
        '3xl': '1792px',
        '4xl': '2048px',
        '5xl': '2560px',
        '6xl': '3072px',
        '7xl': '3584px',
      },
      boxShadow: {
        lightXs: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
        lightXl:
          '0px 20px 25px -5px rgba(0, 0, 0, 0.10), 0px 8px 10px -6px rgba(0, 0, 0, 0.10)',
      },
      fontFamily: {
        Poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
  darkMode: 'selector',
}
