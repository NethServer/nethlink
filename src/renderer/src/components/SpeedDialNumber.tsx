import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from './Nethesis/'

export interface SpeedDialNumberProps {
  name: string
  number: string
  callUser: () => void
  showNumberDetails: () => void
}

export function SpeedDialNumber({
  name,
  number,
  callUser,
  showNumberDetails
}: SpeedDialNumberProps): JSX.Element {
  return (
    <div className="flex flex-row justify-between items-center font-semibold min-h-[44px]">
      <div className="flex gap-6 items-center">
        <Avatar size="base" className="bg-white z-0" />
        <div className="flex flex-col gap-1">
          <p className="text-gray-50">{name}</p>
          <div className="flex gap-2 items-center">
            <FontAwesomeIcon
              style={{ fontSize: '16px', color: '#9CA3AF' }}
              icon={faPhone}
              onClick={callUser}
            />
            <a href={`tel://${number}`} className="text-blue-500 font-normal">{number}</a>
          </div>
        </div>
      </div>
      <div className="flex justify-center min-w-4 min-h-4">
        <FontAwesomeIcon
          style={{ fontSize: '16px' }}
          icon={faEllipsisVertical}
          onClick={showNumberDetails}
        />
      </div>
    </div>
  )
}
