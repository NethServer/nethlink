import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faEllipsisVertical, faPen, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from './Nethesis/'
import { PlaceholderIcon } from '@renderer/icons'
import { NumberCaller } from './NumberCaller'
import { Menu } from '@headlessui/react'
import { ContactType, OperatorData } from '@shared/types'
import { t } from 'i18next'
import { useSubscriber } from '@renderer/hooks/useSubscriber'

export interface SpeedDialNumberProps {
  user: ContactType
  callUser: () => void
  handleSelectedSpeedDial: (id: string, name: string, speeddial_num: string) => void
  handleDeleteSpeedDial: () => void
}

export function SpeedDialNumber({
  user,
  callUser,
  handleSelectedSpeedDial,
  handleDeleteSpeedDial
}: SpeedDialNumberProps): JSX.Element {
  const operators = useSubscriber<OperatorData>('operators')

  //const username = user.speeddial_num ? operators.extensions[user.speeddial_num]?.username : undefined

  return (
    <div className="flex flex-row justify-between items-center font-semibold min-h-[44px]">
      <div className="flex gap-6 items-center">
        <Avatar
          size="base"
          src={
            operators?.avatars?.[user.name!]
          }
          status={
            operators?.operators?.[user.name!]?.mainPresence || 'offline'
          }
          className="z-0"
          placeholder={PlaceholderIcon}
        />
        <div className="flex flex-col gap-1">
          <p className="dark:text-gray-50 text-gray-900">{user.name!}</p>
          <div className="flex gap-2 items-center">
            <FontAwesomeIcon
              className="dark:text-gray-400 text-gray-600 text-base"
              icon={faPhone}
              onClick={callUser}
            />
            <NumberCaller
              number={user.speeddial_num!}
              className="dark:text-blue-500 text-blue-600 font-normal"
            >
              {user.speeddial_num!}
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
                    icon={faEllipsisVertical}
                  />
                </div>
              </Menu.Button>
            </div>
            <Menu.Items
              className={`mt-2 fixed border dark:border-gray-700 border-gray-200 rounded-lg min-w-[180px] min-h-[84px] dark:bg-gray-900 bg-gray-50 translate-x-[calc(-100%+36px)] z-[110]`}
            >
              <Menu.Item>
                <div
                  className="flex flex-row items-center py-[10px] px-6 dark:hover:bg-gray-700 hover:bg-gray-200 mt-2"
                  onClick={() => {
                    handleSelectedSpeedDial(user.id! as string, user.name!, user.speeddial_num!)
                  }}
                >
                  <div className="flex gap-3 items-center">
                    <FontAwesomeIcon
                      className="text-base dark:text-gray-50 text-gray-900"
                      icon={faPen}
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
                  onClick={handleDeleteSpeedDial}
                >
                  <div className="flex gap-3 items-center">
                    <FontAwesomeIcon
                      className="text-base dark:text-gray-50 text-gray-900"
                      icon={faTrashCan}
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
