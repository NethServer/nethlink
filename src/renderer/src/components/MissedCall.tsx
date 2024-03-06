import { faUserPlus, faUsers } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MissedCallIcon, PlaceholderIcon } from '@renderer/icons'
import { Avatar, Button } from './Nethesis/'
import { NumberCaller } from './NumberCaller'
import { useSubscriber } from '@renderer/hooks/useSubscriber'
import { useState } from 'react'
import moment from 'moment'
import { t } from 'i18next'

export interface MissedCallProps {
  username: string
  number: string
  time: number
  duration: number
  company?: string
  handleSelectedMissedCall: (number: string, company: string | undefined) => void
}

export function MissedCall({
  username,
  number,
  time,
  duration,
  company,
  handleSelectedMissedCall
}: MissedCallProps): JSX.Element {
  const operators: any = useSubscriber('operators')
  const [showCreateButton, setShowCreateButton] = useState<boolean>(false)

  function truncate(str: string) {
    return str.length > 15 ? str.substring(0, 14) + '...' : str
  }

  return (
    <div
      className="flex flex-grow gap-3 font-semibold max-h-[72px]"
      onMouseEnter={() => {
        if (username === 'Unknown') {
          setShowCreateButton(() => true)
        }
      }}
      onMouseLeave={() => setShowCreateButton(() => false)}
    >
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
      <div className="flex flex-col gap-2 ml-auto">
        {company && (
          <div className="flex flex-row items-center gap-2 py-1 px-[10px] rounded-[10px] max-h-[22px] font-semibold dark:text-gray-50 text-gray-50 dark:bg-blue-600 bg-blue-600">
            <FontAwesomeIcon icon={faUsers}></FontAwesomeIcon>
            <p className="text-[12x] leading-[18px]">{company}</p>
          </div>
        )}
        {showCreateButton && (
          <Button
            variant="ghost"
            className="flex gap-3 items-center py-2 px-3 border dark:border-gray-500 ml-auto"
            onClick={() => handleSelectedMissedCall(number, company)}
          >
            <FontAwesomeIcon
              className="text-base dark:text-blue-500 text-blue-600"
              icon={faUserPlus}
            />
            <p className="dark:text-blue-500 text-blue-600 font-semibold">
              {t('SpeedDial.Create')}
            </p>
          </Button>
        )}
      </div>
    </div>
  )
}
