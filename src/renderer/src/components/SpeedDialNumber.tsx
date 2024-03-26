import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPhone as CallIcon,
  faEllipsisVertical as MenuIcon,
  faPen as ModifyIcon,
  faTrashCan as DeleteIcon
} from '@fortawesome/free-solid-svg-icons'
import { Avatar } from './Nethesis/'
import { PlaceholderIcon } from '@renderer/icons'
import { NumberCaller } from './NumberCaller'
import { Menu } from '@headlessui/react'
import { ContactType, OperatorData } from '@shared/types'
import { t } from 'i18next'
import { useSubscriber } from '@renderer/hooks/useSubscriber'

export interface SpeedDialNumberProps {
  speedDial: ContactType
  callUser: () => void
  handleSelectedSpeedDial: (selectedSpeedDial: ContactType) => void
  handleDeleteSpeedDial: (deletedSpeedDial: ContactType) => void
  isLastItem: boolean
}

export function SpeedDialNumber({
  speedDial,
  callUser,
  handleSelectedSpeedDial,
  handleDeleteSpeedDial,
  isLastItem
}: SpeedDialNumberProps): JSX.Element {
  const operators = useSubscriber<OperatorData>('operators')

  return (
    <div className="relative flex flex-row justify-between items-center font-semibold min-h-[44px]">
      <div className="flex gap-6 items-center">
        <Avatar
          size="base"
          src={operators?.avatars?.[speedDial.name ?? '']}
          status={operators?.operators?.[speedDial.name ?? '']?.mainPresence || 'offline'}
          className="z-0"
          placeholder={PlaceholderIcon}
        />
        <div className="flex flex-col gap-1">
          <p className="dark:text-gray-50 text-gray-900">{speedDial.name!}</p>
          <div className="flex gap-2 items-center">
            <FontAwesomeIcon
              className="dark:text-gray-400 text-gray-600 text-base"
              icon={CallIcon}
              onClick={callUser}
            />
            <NumberCaller
              number={speedDial.speeddial_num!}
              className="dark:text-blue-500 text-blue-600 font-normal"
            >
              {speedDial.speeddial_num!}
            </NumberCaller>
          </div>
        </div>
      </div>
      <div className="flex justify-center min-w-4 min-h-4">
        <div>
          <Menu>
            <div>
              <Menu.Button>
                <div className="flex items-center justify-center min-w-8 min-h-8">
                  <FontAwesomeIcon
                    className="dark:text-gray-50 text-gray-900 text-base"
                    icon={MenuIcon}
                  />
                </div>
              </Menu.Button>
            </div>
            {/* Controllo per vedere se e' l'ultimo elemento, se e' cosi, il menu ha un top differente */}
            <Menu.Items
              className={`absolute ${isLastItem ? 'top-[-48px]' : 'top-0'} border dark:border-gray-700 border-gray-200 rounded-lg min-w-[180px] min-h-[84px] dark:bg-gray-900 bg-gray-50 translate-x-[calc(-100%+36px)] z-[110]`}
            >
              <Menu.Item>
                <div
                  className="flex flex-row items-center py-[10px] px-6 dark:hover:bg-gray-700 hover:bg-gray-200 mt-2"
                  onClick={() => {
                    handleSelectedSpeedDial(speedDial)
                  }}
                >
                  <div className="flex gap-3 items-center">
                    <FontAwesomeIcon
                      className="text-base dark:text-gray-50 text-gray-900"
                      icon={ModifyIcon}
                    />
                    <p className="font-semibold dark:text-gray-50 text-gray-900">
                      {t('Common.Edit')}
                    </p>
                  </div>
                </div>
              </Menu.Item>

              <Menu.Item>
                <div
                  className="flex flex-row items-center py-[10px] px-6 dark:hover:bg-gray-700 hover:bg-gray-200 mb-2"
                  onClick={() => handleDeleteSpeedDial(speedDial)}
                >
                  <div className="flex gap-3 items-center">
                    <FontAwesomeIcon
                      className="text-base dark:text-gray-50 text-gray-900"
                      icon={DeleteIcon}
                    />
                    <p className="font-semibold dark:text-gray-50 text-gray-900">
                      {t('Common.Delete')}
                    </p>
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
