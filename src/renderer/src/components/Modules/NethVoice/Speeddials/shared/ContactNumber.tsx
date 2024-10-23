import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEllipsisVertical as MenuIcon,
  faPenToSquare as ModifyIcon,
  faTrash as DeleteIcon,
} from '@fortawesome/free-solid-svg-icons'
import { Menu } from '@headlessui/react'
import { ContactType, OperatorData } from '@shared/types'
import { t } from 'i18next'
import { useStoreState } from '@renderer/store'
import { truncate } from '@renderer/utils'
import { useTheme } from '@renderer/theme/Context'
import { ContactNameAndActions } from '@renderer/components/ContactNameAndAction'
import classNames from 'classnames'

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
  isLastItem,
}: SpeedDialNumberProps): JSX.Element {
  const { theme: nethTheme } = useTheme()
  const [operators] = useStoreState<OperatorData>('operators')

  return (
    <div
      className={`relative flex flex-row justify-between items-center min-h-[44px] p-2 w-full  ${className}`}
    >
      <ContactNameAndActions
        contact={speedDial}
        avatarDim='base'
        displayedNumber={truncate(speedDial.speeddial_num || '', 19)}
        isHighlight={false}
        number={speedDial.speeddial_num!}
        username={operators?.extensions[speedDial.speeddial_num || '']?.username}

      />

      {!isFavouritePage &&
        <div className="flex justify-center min-w-4 min-h-4">
          <div>
            <Menu>
              <div>
                <Menu.Button className={classNames('flex items-center justify-center min-w-8 min-h-8  dark:hover:bg-transparent hover:bg-transparent', nethTheme.button.ghost, nethTheme.button.base, nethTheme.button.rounded.base)}>
                  <FontAwesomeIcon
                    className="dark:text-titleDark text-titleLight text-base"
                    icon={MenuIcon}
                  />
                </Menu.Button>
              </div>
              <Menu.Items
                className={`absolute ${isLastItem ? 'top-[-48px]' : 'top-0'} border dark:border-borderDark border-borderLight rounded-lg min-w-[180px] min-h-[84px] dark:bg-bgDark bg-bgLight translate-x-[calc(-100%+36px)] z-[110]`}
              >
                <Menu.Item as={'div'} className="cursor-pointer">
                  <div
                    className="flex flex-row items-center py-[10px] px-6 dark:hover:bg-hoverDark hover:bg-hoverLight mt-2"
                    onClick={() => {
                      handleEditSpeedDial?.(speedDial)
                    }}
                  >
                    <div className="flex gap-3 items-center">
                      <FontAwesomeIcon
                        className="text-base dark:text-titleDark text-titleLight"
                        icon={ModifyIcon}
                      />
                      <p className="font-normal text-[14px] leading-5 dark:text-titleDark text-titleLight">
                        {t('Common.Edit')}
                      </p>
                    </div>
                  </div>
                </Menu.Item>

                <Menu.Item as={'div'} className="cursor-pointer">
                  <div
                    className="flex flex-row items-center py-[10px] px-6 dark:text-rose-500 text-rose-700 dark:hover:bg-rose-800 dark:hover:text-gray-50 hover:bg-rose-700 hover:text-gray-50 mb-2"
                    onClick={() => handleDeleteSpeedDial?.(speedDial)}
                  >
                    <div className="flex gap-3 items-center">
                      <FontAwesomeIcon className="text-base" icon={DeleteIcon} />
                      <p className="font-normal text-[14px] leading-5">{t('Common.Delete')}</p>
                    </div>
                  </div>
                </Menu.Item>
              </Menu.Items>
            </Menu >
          </div >
        </div >
      }
    </div >
  )
}
