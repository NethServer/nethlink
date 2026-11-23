import {
  Menu,
  MenuButton,
  MenuHeading,
  MenuItem,
  MenuItems,
  MenuSection,
  MenuSeparator,
} from '@headlessui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faArrowRightFromBracket,
  faArrowRightToBracket,
  faChevronDown,
  faCircleNotch,
  faPlay,
} from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import classNames from 'classnames'
import { useTheme } from '@renderer/theme/Context'
import { PAUSE_REASON_ITEMS } from './QueuePauseMenu'
import { PAUSE_REASONS, PauseReason } from './hook/useQueuesModule'

const ITEM_CLASSES =
  'flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-titleLight data-[focus]:bg-hoverLight dark:text-titleDark dark:data-[focus]:bg-hoverDark'

const Item = ({
  icon,
  label,
  onClick,
}: {
  icon: IconDefinition
  label: string
  onClick: () => void
}) => (
  <MenuItem>
    <button type='button' className={ITEM_CLASSES} onClick={onClick}>
      <FontAwesomeIcon icon={icon} className='size-4' aria-hidden='true' />
      {label}
    </button>
  </MenuItem>
)

export interface QueuesAllMenuProps {
  // log in or out of all the queues, none when the user is a static member of all
  login?: 'logIn' | 'logOut'
  // pause all the queues, or end the pause, none when not logged in to any
  pause?: 'pause' | 'endPause'
  isPending: boolean
  onToggleLogin: () => void
  onPause: (reason: PauseReason) => void
  onEndPause: () => void
}

// the actions on all the queues, in one menu to fit the narrow window
export const QueuesAllMenu = ({
  login,
  pause,
  isPending,
  onToggleLogin,
  onPause,
  onEndPause,
}: QueuesAllMenuProps) => {
  const { button: theme } = useTheme().theme

  return (
    <Menu>
      <MenuButton
        disabled={isPending}
        className={classNames(
          theme.base,
          theme.ghost,
          theme.sizes.small,
          theme.rounded.small,
          '-mr-2.5 shrink-0 gap-2',
        )}
      >
        {isPending && (
          <FontAwesomeIcon
            icon={faCircleNotch}
            spin
            className='size-4'
            aria-hidden='true'
          />
        )}
        {t('Queues.All queues')}
        <FontAwesomeIcon
          icon={faChevronDown}
          className='size-3'
          aria-hidden='true'
        />
      </MenuButton>
      <MenuItems
        anchor='bottom end'
        className='z-[110] min-w-52 rounded-lg border border-borderLight bg-white py-1 shadow-lg [--anchor-gap:4px] focus:outline-none dark:border-borderDark dark:bg-gray-950'
      >
        {login && (
          <Item
            icon={
              login === 'logOut'
                ? faArrowRightFromBracket
                : faArrowRightToBracket
            }
            label={t(
              login === 'logOut'
                ? 'Queues.Log out of all queues'
                : 'Queues.Log in to all queues',
            )}
            onClick={onToggleLogin}
          />
        )}
        {login && pause && (
          <MenuSeparator className='my-1 h-px bg-borderLight dark:bg-borderDark' />
        )}
        {pause === 'endPause' && (
          <Item
            icon={faPlay}
            label={t('Queues.End pause on all queues')}
            onClick={onEndPause}
          />
        )}
        {pause === 'pause' && (
          <MenuSection>
            <MenuHeading className='px-4 pb-1 pt-2 text-xs font-medium leading-4 text-gray-600 dark:text-gray-400'>
              {t('Queues.Pause all queues')}
            </MenuHeading>
            {PAUSE_REASONS.map((reason) => (
              <Item
                key={reason || 'generic'}
                icon={PAUSE_REASON_ITEMS[reason].icon}
                label={t(PAUSE_REASON_ITEMS[reason].label)}
                onClick={() => onPause(reason)}
              />
            ))}
          </MenuSection>
        )}
      </MenuItems>
    </Menu>
  )
}
