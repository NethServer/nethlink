import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faChevronDown,
  faCircleNotch,
  faKitMedical,
  faMugSaucer,
  faPause,
  faThumbTack,
  faUserClock,
} from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import classNames from 'classnames'
import { useTheme } from '@renderer/theme/Context'
import { PAUSE_REASONS, PauseReason } from './hook/useQueuesModule'

// the label and the icon of each reason, as in NethVoice CTI
export const PAUSE_REASON_ITEMS: Record<
  PauseReason,
  { label: string; icon: IconDefinition }
> = {
  '': { label: 'Queues.Break', icon: faUserClock },
  'Lunch break': { label: 'Queues.Lunch break', icon: faMugSaucer },
  Emergency: { label: 'Queues.Emergency', icon: faKitMedical },
  Backend: { label: 'Queues.Backend', icon: faThumbTack },
}

// the text of the reason of a pause: a reason set by another client is shown
// as it is, a generic pause has none
export const getPauseReasonText = (reason?: string) => {
  if (!reason) return undefined
  const item = PAUSE_REASON_ITEMS[reason as PauseReason]
  return item ? t(item.label) : reason
}

// the icon of the reason of a pause: a generic one for no reason, or a reason
// set by another client
export const getPauseReasonIcon = (reason?: string) =>
  PAUSE_REASON_ITEMS[(reason || '') as PauseReason]?.icon ??
  PAUSE_REASON_ITEMS[''].icon

export interface QueuePauseMenuProps {
  label: string
  // the accessible name, when the label alone is not enough
  ariaLabel?: string
  variant: 'white' | 'ghost'
  isPending?: boolean
  disabled?: boolean
  className?: string
  onSelect: (reason: PauseReason) => void
}

export const QueuePauseMenu = ({
  label,
  ariaLabel,
  variant,
  isPending,
  disabled,
  className,
  onSelect,
}: QueuePauseMenuProps) => {
  const { button: theme } = useTheme().theme

  return (
    <Menu>
      <MenuButton
        disabled={disabled || isPending}
        aria-label={ariaLabel}
        className={classNames(
          theme.base,
          theme[variant],
          theme.sizes.small,
          theme.rounded.small,
          'shrink-0 gap-2',
          className,
        )}
      >
        <FontAwesomeIcon
          icon={isPending ? faCircleNotch : faPause}
          spin={isPending}
          className='size-4'
          aria-hidden='true'
        />
        {label}
        <FontAwesomeIcon
          icon={faChevronDown}
          className='size-3'
          aria-hidden='true'
        />
      </MenuButton>
      <MenuItems
        anchor='bottom end'
        className='z-[110] min-w-44 rounded-lg border border-borderLight bg-white py-1 shadow-lg [--anchor-gap:4px] focus:outline-none dark:border-borderDark dark:bg-gray-950'
      >
        {PAUSE_REASONS.map((reason) => (
          <MenuItem key={reason || 'generic'}>
            <button
              type='button'
              className='flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-titleLight data-[focus]:bg-hoverLight dark:text-titleDark dark:data-[focus]:bg-hoverDark'
              onClick={() => onSelect(reason)}
            >
              <FontAwesomeIcon
                icon={PAUSE_REASON_ITEMS[reason].icon}
                className='size-4'
                aria-hidden='true'
              />
              {t(PAUSE_REASON_ITEMS[reason].label)}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}
