import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from '@nethesis/react-components/src/components/common'

export interface NumberBoxProps {
  name: string
  number: string
  callUser: () => void
  showNumberDetails: () => void
}

export function NumberBox({
  name,
  number,
  callUser,
  showNumberDetails
}: NumberBoxProps): JSX.Element {
  return (
    <div className="flex flex-row justify-between items-center font-semibold min-h-[44px]">
      <div className="flex gap-6 items-center">
        <Avatar size="base" className="bg-white" />
        <div className="flex flex-col gap-1">
          <p className="text-gray-50">{name}</p>
          <div className="flex gap-2 items-center">
            <FontAwesomeIcon
              style={{ fontSize: '16px', color: '#9CA3AF' }}
              icon={faPhone}
              onClick={callUser}
            />
            <p className="text-blue-500 font-normal">{number}</p>
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
