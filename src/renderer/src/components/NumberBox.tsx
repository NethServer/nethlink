import { AvatarButton } from './AvatarButton'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'

export interface NumberBoxProps {
  name: string
  number: number
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
        <AvatarButton className="min-w-10 min-h-10"></AvatarButton>
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
