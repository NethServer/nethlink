import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEllipsisVertical as MenuIcon,
  faPenToSquare as ModifyIcon,
  faTrash as DeleteIcon,
  faMessage,
} from '@fortawesome/free-solid-svg-icons'
import { Menu, MenuItem, MenuItems, MenuButton } from '@headlessui/react'
import { ContactType } from '@shared/types'
import { t } from 'i18next'
import { useNethlinkData } from '@renderer/store'
import { truncate } from '@renderer/utils'
import { useTheme } from '@renderer/theme/Context'
import { ContactNameAndActions } from '@renderer/components/Modules/NethVoice/BaseModule/ContactNameAndAction'
import classNames from 'classnames'
import { Button } from '@renderer/components/Nethesis'
import { openChat } from '@renderer/hooks/useChatBridge'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CustomThemedTooltip'

export interface SpeedDialNumberProps {
  speedDial: ContactType
  className?: string
  handleEditSpeedDial?: (editSpeedDial: ContactType) => void
  handleDeleteSpeedDial?: (deleteSpeedDial: ContactType) => void
  isLastItem: boolean
  isFavouritePage: boolean
}

export function ContactNumber({
  speedDial,
  className,
  isFavouritePage,
  handleEditSpeedDial,
  handleDeleteSpeedDial,
}: SpeedDialNumberProps): JSX.Element {
  const { theme: nethTheme } = useTheme()
  const [operators] = useNethlinkData('operators')
  const [chatStatus] = useNethlinkData('chatStatus')
  const username =
    operators?.extensions[speedDial.speeddial_num || '']?.username

  const chatTooltipId = `tooltip-chat-${speedDial.id}`
  const menuTooltipId = `tooltip-speed-dial-menu-${speedDial.id}`

  return (
    <div
      className={classNames(
        'relative flex min-h-14 w-full flex-row items-center justify-between gap-3 py-3',
        className,
      )}
    >
      <ContactNameAndActions
        contact={speedDial}
        avatarDim='small'
        displayedNumber={truncate(speedDial.speeddial_num || '', 19)}
        isHighlight={false}
        number={speedDial.speeddial_num!}
        username={username}
        isFavourite={isFavouritePage}
        isSearchData={false}
      />

      {/* An operator: chat with them */}
      {username && chatStatus === 'online' && (
        <>
          <Button
            variant='ghost'
            className='shrink-0 p-2'
            aria-label={t('Chat.Chat') as string}
            data-tooltip-id={chatTooltipId}
            data-tooltip-content={t('Chat.Chat') as string}
            onClick={() => openChat(username)}
          >
            <FontAwesomeIcon
              icon={faMessage}
              className='size-4'
              aria-hidden='true'
            />
          </Button>
          <CustomThemedTooltip id={chatTooltipId} place='left' />
        </>
      )}

      {!isFavouritePage && (
        <Menu>
          <MenuButton
            aria-label={t('SpeedDial.Open speed dial menu') as string}
            data-tooltip-id={menuTooltipId}
            data-tooltip-content={t('SpeedDial.Open speed dial menu') as string}
            className={classNames(
              'size-8 shrink-0',
              nethTheme.button.base,
              nethTheme.button.tertiary,
              nethTheme.button.rounded.base,
            )}
          >
            <FontAwesomeIcon
              className='size-4 text-gray-700 dark:text-gray-200'
              icon={MenuIcon}
              aria-hidden='true'
            />
          </MenuButton>
          <CustomThemedTooltip id={menuTooltipId} place='left' />
          <MenuItems
            anchor='bottom end'
            className='z-[110] min-w-44 rounded-lg border border-borderLight bg-white py-1 shadow-lg focus:outline-none dark:border-borderDark dark:bg-gray-950'
          >
            <MenuItem>
              <button
                type='button'
                className='flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-titleLight data-[focus]:bg-hoverLight dark:text-titleDark dark:data-[focus]:bg-hoverDark'
                onClick={() => handleEditSpeedDial?.(speedDial)}
              >
                <FontAwesomeIcon
                  className='size-4'
                  icon={ModifyIcon}
                  aria-hidden='true'
                />
                {t('Common.Edit')}
              </button>
            </MenuItem>
            <MenuItem>
              <button
                type='button'
                className='flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-rose-700 data-[focus]:bg-rose-700 data-[focus]:text-white dark:text-rose-500 dark:data-[focus]:bg-rose-600 dark:data-[focus]:text-white'
                onClick={() => handleDeleteSpeedDial?.(speedDial)}
              >
                <FontAwesomeIcon
                  className='size-4'
                  icon={DeleteIcon}
                  aria-hidden='true'
                />
                {t('Common.Delete')}
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      )}
    </div>
  )
}
