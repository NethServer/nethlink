import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPhone as CallIcon,
  faEllipsisVertical as MenuIcon,
  faPenToSquare as ModifyIcon,
  faTrash as DeleteIcon,
  faCircleUser as UserIcon
} from '@fortawesome/free-solid-svg-icons'
import { Avatar, Button } from './Nethesis/'
import { NumberCaller } from './NumberCaller'
import { Menu } from '@headlessui/react'
import { ContactType, OperatorData } from '@shared/types'
import { t } from 'i18next'
import { useSubscriber } from '@renderer/hooks/useSubscriber'
import { truncate } from '@renderer/utils'

export interface SpeedDialNumberProps {
  speedDial: ContactType
  className?: string
  callUser: () => void
  handleSelectedSpeedDial: (selectedSpeedDial: ContactType) => void
  handleDeleteSpeedDial: (deletedSpeedDial: ContactType) => void
  isLastItem: boolean
}

export function SpeedDialNumber({
  speedDial,
  className,
  callUser,
  handleSelectedSpeedDial,
  handleDeleteSpeedDial,
  isLastItem
}: SpeedDialNumberProps): JSX.Element {
  const operators = useSubscriber<OperatorData>('operators')
  const avatarSrc =
    operators?.avatars?.[operators?.extensions[speedDial.speeddial_num || '']?.username]

  return (
    <div
      className={`relative flex flex-row justify-between items-center min-h-[44px] p-2 px-5 ${className}`}
    >
      <div className="flex gap-6 items-center">
        {avatarSrc ? (
          <Avatar
            size="base"
            src={avatarSrc}
            status={
              operators?.operators?.[operators?.extensions[speedDial.speeddial_num || '']?.username]
                ?.mainPresence || undefined
            }
            className="z-0"
          />
        ) : (
          <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={UserIcon} className="h-10 w-10 text-gray-400" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <p className="dark:text-gray-50 text-gray-900 font-medium text-[14px] leading-5">
            {truncate(speedDial.name!, 20)}
          </p>
          <div className="flex gap-2 items-center">
            <FontAwesomeIcon
              className="dark:text-gray-400 text-gray-600 text-base"
              icon={CallIcon}
              onClick={callUser}
            />
            <NumberCaller
              number={speedDial.speeddial_num!}
              className="dark:text-blue-500 text-blue-700 font-normal hover:underline"
            >
              {truncate(speedDial.speeddial_num!, 19)}
            </NumberCaller>
          </div>
        </div>
      </div>
      <div className="flex justify-center min-w-4 min-h-4">
        <div>
          <Menu>
            <div>
              <Menu.Button>
                {/* <div className=""> */}
                <Button
                  variant="ghost"
                  className="flex items-center justify-center min-w-8 min-h-8 cursor-pointer dark:hover:bg-gray-900 hover:bg-gray-50 dark:focus:ring-2 focus:ring-2 dark:focus:ring-blue-200 focus:ring-blue-500"
                >
                  <FontAwesomeIcon
                    className="dark:text-gray-50 text-gray-900 text-base"
                    icon={MenuIcon}
                  />
                </Button>
                {/* </div> */}
              </Menu.Button>
            </div>
            {/* Controllo per vedere se e' l'ultimo elemento, se e' cosi, il menu ha un top differente */}
            <Menu.Items
              className={`absolute ${isLastItem ? 'top-[-48px]' : 'top-0'} border dark:border-gray-700 border-gray-200 rounded-lg min-w-[180px] min-h-[84px] dark:bg-gray-900 bg-gray-50 translate-x-[calc(-100%+36px)] z-[110]`}
            >
              <Menu.Item as={'div'} className="cursor-pointer">
                <div
                  className="flex flex-row items-center py-[10px] px-6 dark:hover:bg-gray-800 hover:bg-gray-200 mt-2"
                  onClick={() => {
                    handleSelectedSpeedDial(speedDial)
                  }}
                >
                  <div className="flex gap-3 items-center">
                    <FontAwesomeIcon
                      className="text-base dark:text-gray-50 text-gray-900"
                      icon={ModifyIcon}
                    />
                    <p className="font-normal text-[14px] leading-5 dark:text-gray-50 text-gray-900">
                      {t('Common.Edit')}
                    </p>
                  </div>
                </div>
              </Menu.Item>

              <Menu.Item as={'div'} className="cursor-pointer">
                <div
                  className="flex flex-row items-center py-[10px] px-6 dark:text-rose-500 text-rose-700 dark:hover:bg-rose-800 dark:hover:text-gray-50 hover:bg-rose-700 hover:text-gray-50 mb-2"
                  onClick={() => handleDeleteSpeedDial(speedDial)}
                >
                  <div className="flex gap-3 items-center">
                    <FontAwesomeIcon className="text-base" icon={DeleteIcon} />
                    <p className="font-normal text-[14px] leading-5">{t('Common.Delete')}</p>
                  </div>
                </div>
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>
    </div>
  )
}
