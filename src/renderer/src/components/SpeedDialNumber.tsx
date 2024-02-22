import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faEllipsisVertical, faPen, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from './Nethesis/'
import { PlaceholderIcon } from '@renderer/icons'
import { NumberCaller } from './NumberCaller'
import { Menu } from '@headlessui/react'

export interface SpeedDialNumberProps {
  name: string
  number: string
  callUser: () => void
}

export function SpeedDialNumber({ name, number, callUser }: SpeedDialNumberProps): JSX.Element {
  return (
    <div className="flex flex-row justify-between items-center font-semibold min-h-[44px]">
      <div className="flex gap-6 items-center">
        <Avatar size="base" className="bg-white z-0" placeholder={PlaceholderIcon} />
        <div className="flex flex-col gap-1">
          <p className="text-gray-50">{name}</p>
          <div className="flex gap-2 items-center">
            <FontAwesomeIcon
              style={{ fontSize: '16px', color: '#9CA3AF' }}
              icon={faPhone}
              onClick={callUser}
            />
            <NumberCaller number={number} className="text-blue-500 font-normal">
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
                  <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faEllipsisVertical} />
                </div>
              </Menu.Button>
            </div>
            <Menu.Items
              className={`mt-2 fixed border border-gray-700 rounded-lg min-w-[180px] min-h-[84px] bg-gray-900 z-20 translate-x-[calc(-100%+36px)]`}
            >
              <Menu.Item>
                <div
                  className="flex flex-row items-center py-[10px] px-6 hover:bg-gray-700 mt-2"
                  onClick={() => alert('Modifica il numero.')}
                >
                  <div className="flex gap-3 items-center">
                    <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faPen} />
                    <p className="font-semibold">Modifica</p>
                  </div>
                </div>
              </Menu.Item>
              <Menu.Item>
                <div
                  className="flex flex-row items-center py-[10px] px-6 hover:bg-gray-700 mb-2"
                  onClick={() => alert('Elimina ')}
                >
                  <div className="flex gap-3 items-center">
                    <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faTrashCan} />
                    <p className="font-semibold">Elimina</p>
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
