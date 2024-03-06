import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faEllipsisVertical, faPen, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from './Nethesis/'
import { PlaceholderIcon } from '@renderer/icons'
import { NumberCaller } from './NumberCaller'
import { Menu } from '@headlessui/react'

export interface SpeedDialNumberProps {
  username: string
  number: string
  callUser: () => void
  handleModifySpeedDial: () => void
  handleDeleteSpeedDial: () => void
}

export function SpeedDialNumber({
  username,
  number,
  callUser,
  handleModifySpeedDial,
  handleDeleteSpeedDial
}: SpeedDialNumberProps): JSX.Element {
  return (
    <div className="flex flex-row justify-between items-center font-semibold min-h-[44px]">
      <div className="flex gap-6 items-center">
        <Avatar size="base" className="z-0" placeholder={PlaceholderIcon} />
        <div className="flex flex-col gap-1">
          <p className="dark:text-gray-50 text-gray-900">{username}</p>
          <div className="flex gap-2 items-center">
            <FontAwesomeIcon
              className="dark:text-gray-400 text-gray-600 text-base"
              icon={faPhone}
              onClick={callUser}
            />
            <NumberCaller number={number} className="dark:text-blue-500 text-blue-600 font-normal">
              {number}
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
              className={`mt-2 fixed border dark:border-gray-700 border-gray-200 rounded-lg min-w-[180px] min-h-[84px] dark:bg-gray-900 bg-gray-50 z-20 translate-x-[calc(-100%+36px)]`}
            >
              <Menu.Item>
                <div
                  className="flex flex-row items-center py-[10px] px-6 dark:hover:bg-gray-700 hover:bg-gray-200 mt-2"
                  onClick={handleModifySpeedDial}
                >
                  <div className="flex gap-3 items-center">
                    <FontAwesomeIcon
                      className="text-base dark:text-gray-50 text-gray-900"
                      icon={faPen}
                    />
                    <p className="font-semibold dark:text-gray-50 text-gray-900">Modifica</p>
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
                    <p className="font-semibold dark:text-gray-50 text-gray-900">Elimina</p>
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
