import { AvatarImage } from './AvatarImage'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@nethesis/react-components/src/components/common'

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
        <AvatarImage className="min-w-10 min-h-10" />
        <div className="flex flex-col gap-1">
          <p className="text-gray-50">{name}</p>
          <Button className="gap-2 pt-0 pr-0 pb-0 pl-0">
            <FontAwesomeIcon
              style={{ fontSize: '16px', color: '#9CA3AF' }}
              icon={faPhone}
              onClick={callUser}
            />
            <p className="text-blue-500 font-normal w-full">{number}</p>
          </Button>
        </div>
      </div>
      <Button className="pt-0 pr-0 pb-0 pl-0" onClick={showNumberDetails}>
        <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faEllipsisVertical} />
      </Button>
    </div>
  )
}
