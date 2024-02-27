import { faUsers } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MissedCallIcon, PlaceholderIcon } from '@renderer/icons'
import { Avatar, Badge } from './Nethesis/'
import { NumberCaller } from './NumberCaller'
import moment from 'moment'
import { useSubscriber } from '@renderer/hooks/useSubscriber'

export interface MissedCallProps {
  username: string
  number: string
  time: number
  duration: number
  company?: string
}

export function MissedCall({
  username,
  number,
  time,
  duration,
  company
}: MissedCallProps): JSX.Element {
  const operators = useSubscriber('operators')
  function truncate(str: string) {
    return str.length > 15 ? str.substring(0, 14) + '...' : str
  }

  return (
    <div className="flex flex-grow gap-3 font-semibold max-h-[72px]">
      <div className="flex flex-col h-full min-w-6 pt-[6px]">
        <Avatar
          size="extra_small"
          placeholder={PlaceholderIcon}
          status={operators[username]?.mainPresence}
        />
      </div>
      <div className="flex flex-col gap-1 dark:text-gray-50 text-gray-900">
        <p>{truncate(username)}</p>
        <div className="flex flex-row gap-2 items-center">
          <MissedCallIcon />
          <NumberCaller number={number} className="dark:text-blue-500 text-blue-600 font-normal">
            {number}
          </NumberCaller>
        </div>
        <div className="flex flex-row gap-1">
          <p>{duration}m</p>
          <p>({moment(time).format('HH:MM')})</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 ml-auto ">
        {company && (
          <Badge
            variant="offline"
            size="small"
            className="flex flex-row gap-2 py-1 px-[10px] rounded-[10px] max-h-[22px] font-semibold dark:text-gray-100 dark:bg-blue-500"
          >
            <FontAwesomeIcon icon={faUsers}></FontAwesomeIcon>
            {company}
          </Badge>
        )}
      </div>
    </div>
  )
}
