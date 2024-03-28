import { faUserPlus as AddUserIcon, faUsers as BadgeIcon } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MissedCallIcon, PlaceholderIcon } from '@renderer/icons'
import { Avatar, Button } from './Nethesis/'
import { NumberCaller } from './NumberCaller'
import { useSubscriber } from '@renderer/hooks/useSubscriber'
import { useState } from 'react'
import { CallData, OperatorData, QueuesType } from '@shared/types'
import { t } from 'i18next'
import { CallsDate } from './Nethesis/CallsDate'
import { truncate } from '@renderer/utils'

export interface MissedCallProps {
  call: CallData
  handleSelectedMissedCall: (number, company) => void
}

export function MissedCall({ call, handleSelectedMissedCall }: MissedCallProps): JSX.Element {
  const queues = useSubscriber<QueuesType>('queues')
  const operators = useSubscriber<OperatorData>('operators')
  const [showCreateButton, setShowCreateButton] = useState<boolean>(false)

  function getCallName(call: CallData): string {
    if (call.direction === 'in') return call?.cnam || call?.ccompany || `${t('Common.Unknown')}`
    return call?.dst_cnam || call?.dst_ccompany || `${t('Common.Unknown')}`
  }

  function getOperatorByPhoneNumber(phoneNumber: string, operators: any) {
    return Object.values(operators).find((extensions: any) => extensions.id === phoneNumber)
  }

  if (call?.dst_cnam === '') {
    const operatorFound: any = getOperatorByPhoneNumber(call?.dst as string, operators)

    if (operatorFound) {
      call.dst_cnam = operatorFound?.name
    }
  }

  return (
    <div
      className="flex flex-grow gap-3 font-semibold max-h-[72px]"
      onMouseEnter={() => {
        if (getCallName(call) === t('Common.Unknown')) {
          setShowCreateButton(() => true)
        }
      }}
      onMouseLeave={() => setShowCreateButton(() => false)}
    >
      <div className="flex flex-col h-full min-w-6 pt-[6px]">
        <Avatar
          size="extra_small"
          src={operators?.avatars?.[call.cnam!]}
          placeholder={PlaceholderIcon}
          status={operators?.operators?.[call.cnam!]?.mainPresence || 'offline'}
        />
      </div>
      <div className="flex flex-col gap-1 dark:text-gray-50 text-gray-900">
        <p>{truncate(getCallName(call), 15)}</p>
        <div className="flex flex-row gap-2 items-center">
          <MissedCallIcon />
          <NumberCaller
            number={call.cnum!}
            className="dark:text-blue-500 text-blue-600 font-normal"
          >
            {call.cnum}
          </NumberCaller>
        </div>
        <div className="flex flex-row gap-1">
          <CallsDate call={call} spaced={true} />
        </div>
      </div>

      <div className="flex flex-col gap-2 ml-auto">
        {/* Badge */}
        {call.channel?.includes('from-queue') && (
          <div className="flex flex-row justify-center items-center py-1 px-[10px] rounded-[10px] font-semibold dark:text-gray-50 text-gray-50 dark:bg-blue-600 bg-blue-600 w-fit ml-auto max-h-[22px]">
            <FontAwesomeIcon icon={BadgeIcon} className="h-4 w-4 mr-2 ml-1" aria-hidden="true" />
            <p className="text-[12x] leading-[18px]">
              {queues[call.queue!]?.name
                ? queues[call.queue!]?.name + ' ' + call?.queue
                : t('QueueManager.Queue')}
            </p>
          </div>
        )}
        {showCreateButton && (
          <Button
            variant="ghost"
            className="flex gap-3 items-center py-2 px-3 border dark:border-gray-500 ml-auto"
            onClick={() => handleSelectedMissedCall(call.cnum, call.ccompany)}
          >
            <FontAwesomeIcon
              className="text-base dark:text-blue-500 text-blue-600"
              icon={AddUserIcon}
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
