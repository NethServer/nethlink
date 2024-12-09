import { useSharedState } from '@renderer/store'
import { parseThemeToClassName } from '@renderer/utils'

export function InCallAnsweredIcon() {
  const [theme, _] = useSharedState('theme')
  return (
    <svg
      viewBox="0 0 448 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="max-w-4 max-h-4 rotate-[315deg]"
    >
      <path
        d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"
        fill={`${parseThemeToClassName(theme) === 'dark' ? '#22C55E' : '#15803D'}`}
      />
    </svg>
  )
}
