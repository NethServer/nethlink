import { faUsers } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MissedCallIcon, PlaceholderIcon } from '@renderer/icons'
/* Badge da aggiungere*/
import { Avatar, Badge } from './Nethesis/'
import { NumberCaller } from './NumberCaller'
import moment from 'moment'

export interface MissedCallProps {
  name: string
  number: string
  time: number
  duration: number
  company?: string
}

export function MissedCall({
  name,
  number,
  time,
  duration,
  company
}: MissedCallProps): JSX.Element {
  function truncate(str: string) {
    return str.length > 15 ? str.substring(0, 14) + '...' : str
  }

  return (
    <div className="flex flex-grow gap-3 font-semibold max-h-[72px]">
      <div className="flex flex-col h-full min-w-6 pt-[6px]">
        <Avatar size="extra_small" placeholder={PlaceholderIcon} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-gray-50">{truncate(name)}</p>
        <div className="flex flex-row gap-2">
          <MissedCallIcon />
          <NumberCaller number={number} className="text-blue-500 font-normal">{number}</NumberCaller>
        </div>
        <div className="flex flex-row gap-1">
          <p>{duration}m</p>
          <p>({moment(time).format('HH:MM')})</p>
        </div>
      </div>
      {company && (
        <Badge
          variant="offline"
          size="small"
          className="flex flex-row gap-2 py-1 px-[10px] rounded-[10px] max-h-[22px] font-semibold ml-auto text-gray-100"
        >
          <FontAwesomeIcon icon={faUsers}></FontAwesomeIcon>
          {company}
        </Badge>
      )}
    </div>
  )
}
