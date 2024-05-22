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
import { useAccount } from '@renderer/hooks/useAccount'

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
  const { isCallsEnabled } = useAccount()
  const avatarSrc =
    operators?.avatars?.[operators?.extensions[speedDial.speeddial_num || '']?.username]

  return (
    <div
      className={`relative flex flex-row justify-between items-center min-h-[44px] p-2 px-5 ${className}`}
    >
      <div className="flex gap-6 items-center">
        <Avatar
          size="base"
          src={avatarSrc}
          status={
            operators?.operators?.[operators?.extensions[speedDial.speeddial_num || '']?.username]
              ?.mainPresence || undefined
          }
          className="z-0"
          placeholderType={operators?.extensions[speedDial.speeddial_num || ''] ? 'operator' : 'person'}
        />
        <div className="flex flex-col gap-1">
          <p className="dark:text-titleDark text-titleLight font-medium text-[14px] leading-5">
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
              disabled={!isCallsEnabled}
              className="dark:text-textBlueDark text-textBlueLight font-normal hover:underline"
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
                  className="flex items-center justify-center min-w-8 min-h-8 dark:hover:bg-bgDark hover:bg-bgLight"
                >
                  <FontAwesomeIcon
                    className="dark:text-titleDark text-titleLight text-base"
                    icon={MenuIcon}
                  />
                </Button>
                {/* </div> */}
              </Menu.Button>
            </div>
            {/* Controllo per vedere se e' l'ultimo elemento, se e' cosi, il menu ha un top differente */}
            <Menu.Items
              className={`absolute ${isLastItem ? 'top-[-48px]' : 'top-0'} border dark:border-borderDark border-borderLight rounded-lg min-w-[180px] min-h-[84px] dark:bg-bgDark bg-bgLight translate-x-[calc(-100%+36px)] z-[110]`}
            >
              <Menu.Item as={'div'} className="cursor-pointer">
                <div
                  className="flex flex-row items-center py-[10px] px-6 dark:hover:bg-hoverDark hover:bg-hoverLight mt-2"
                  onClick={() => {
                    handleSelectedSpeedDial(speedDial)
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
