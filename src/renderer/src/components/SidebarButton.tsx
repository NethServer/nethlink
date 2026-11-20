import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import classNames from 'classnames'
import { useId } from 'react'
import { CustomThemedTooltip } from './Nethesis/CustomThemedTooltip'

export interface SidebarButtonProps {
  icon: IconDefinition
  // the name of the section: the accessible name and the tooltip of the button
  label: string
  isSelected?: boolean
  className?: string
  hasNotification?: boolean
  hasPulseNotification?: boolean
  onClick?: () => void
}
export function SidebarButton({
  icon,
  label,
  className,
  isSelected,
  hasNotification,
  hasPulseNotification,
  onClick,
}: SidebarButtonProps): JSX.Element {
  const tooltipId = useId()

  return (
    <>
      <button
        type='button'
        aria-label={label}
        aria-current={isSelected ? 'page' : undefined}
        data-tooltip-id={tooltipId}
        data-tooltip-content={label}
        className={classNames(
          'relative flex size-8 items-center justify-center rounded transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:focus-visible:ring-primaryRingDark',
          isSelected
            ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-50',
          className,
        )}
        onClick={onClick}
      >
        {isSelected && (
          <span className='absolute right-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-l-md bg-textBlueLight dark:bg-textBlueDark' />
        )}
        <FontAwesomeIcon icon={icon} className='size-5' aria-hidden='true' />
        {hasNotification && (
          <span className='absolute -left-0.5 -top-0.5 flex items-center justify-center'>
            <span className='size-3 rounded-full border-2 border-bgLight bg-textRedLight dark:border-bgDark dark:bg-textRedDark' />
            {!isSelected && hasPulseNotification && (
              <span className='absolute size-2.5 animate-ping rounded-full bg-textRedLight dark:bg-textRedDark' />
            )}
          </span>
        )}
      </button>
      <CustomThemedTooltip id={tooltipId} place='left' />
    </>
  )
}
