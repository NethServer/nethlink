import { AvatarImage } from './AvatarImage'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@nethesis/react-components/src/components/common'
import { MissedCallIcon } from '@renderer/icons/MissedCallIcon'

export interface MissedCallProps {
  name: string
  number: number
  time: string
}

export function MissedCall({ name, number, time }: MissedCallProps): JSX.Element {
  return (
    <div className="flex flex-row  gap-3 font-semibold min-h-[72px]">
      <div className="flex flex-col h-full min-w-6 pt-[6px]">
        <AvatarImage className="min-w-6 min-h-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-gray-50">{name}</p>
        <Button className="gap-2 pt-0 pr-0 pb-0 pl-0">
          {/* Usare svg */}
          <MissedCallIcon />
          {/* <FontAwesomeIcon style={{ fontSize: '16px', color: '#9CA3AF' }} icon={faPhone} /> */}
          <p className="text-blue-500 font-normal w-full">{number}</p>
        </Button>
        <p>{time}</p>
      </div>
    </div>
  )
}
