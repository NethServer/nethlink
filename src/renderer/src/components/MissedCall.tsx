import {
  faUserPlus as AddUserIcon,
  faUsers as BadgeIcon,
  faCircleUser
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MissedCallIcon } from '@renderer/icons'
import { Avatar, Button } from './Nethesis/'
import { NumberCaller } from './NumberCaller'
import { useSubscriber } from '@renderer/hooks/useSubscriber'
import { useEffect, useState } from 'react'
import { CallData, OperatorData, QueuesType } from '@shared/types'
import { t } from 'i18next'
import { CallsDate } from './Nethesis/CallsDate'
import { truncate } from '@renderer/utils'
import { Tooltip } from 'react-tooltip'
import { Badge } from './Nethesis/Badge'

export interface MissedCallProps {
  call: CallData
  className?: string
  handleSelectedMissedCall: (number, company) => void
}

export function MissedCall({
  call,
  className,
  handleSelectedMissedCall
}: MissedCallProps): JSX.Element {
  const queues = useSubscriber<QueuesType>('queues')
  const operators = useSubscriber<OperatorData>('operators')
  const [showCreateButton, setShowCreateButton] = useState<boolean>(false)
  const avatarSrc = operators?.avatars?.[operators?.extensions[getCallExt(call)]?.username]
  const [isQueueLoading, setIsQueueLoading] = useState<boolean>(true)

  function getCallName(call: CallData): string {
    if (call.direction === 'in') return call?.cnam || call?.ccompany || `${t('Common.Unknown')}`
    return call?.dst_cnam || call?.dst_ccompany || `${t('Common.Unknown')}`
  }

  function getCallExt(call: CallData): string {
    if (call.direction === 'in') return call.src || ''
    return call.dst || ''
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

  useEffect(() => {
    if (isQueueLoading && queues !== undefined) {
      setIsQueueLoading(() => false)
    }
  }, [queues])

  return (
    <div
      className={`flex flex-grow gap-3 min-h-[72px] p-2 px-5 ${className}`}
      onMouseEnter={() => {
        if (getCallName(call) === t('Common.Unknown')) {
          setShowCreateButton(() => true)
        }
      }}
      onMouseLeave={() => setShowCreateButton(() => false)}
    >
      <div className="flex flex-col h-full min-w-6 pt-[6px]">
        {avatarSrc ? (
          <Avatar
            size="extra_small"
            src={avatarSrc}
            status={
              operators?.operators?.[operators?.extensions[getCallExt(call)]?.username]
                ?.mainPresence || undefined
            }
          />
        ) : (
          <FontAwesomeIcon
            icon={faCircleUser}
            className="h-6 w-6 dark:text-gray-200 text-gray-400"
          />
        )}
      </div>
      <div className="flex flex-col gap-1 dark:text-gray-50 text-gray-900">
        <p className="font-medium text-[14px] leading-5">{truncate(getCallName(call), 15)}</p>
        <div className="flex flex-row gap-2 items-center">
          <MissedCallIcon />
          <NumberCaller
            number={getCallExt(call)}
            className="dark:text-blue-500 text-blue-700 font-normal text-[14px] leading-5 hover:underline"
          >
            {call.cnum}
          </NumberCaller>
        </div>
        <div className="flex flex-row gap-1">
          <CallsDate call={call} spaced={true} />
        </div>
      </div>

      <div className="flex flex-col justify-between ml-auto items-center">
        {call.channel?.includes('from-queue') && (
          <>
            {isQueueLoading ? (
              <Badge
                variant="offline"
                rounded="full"
                className={`animate-pulse overflow-hidden ml-1 w-[108px] min-h-4`}
              ></Badge>
            ) : (
              <>
                <Badge
                  size="small"
                  variant="offline"
                  rounded="full"
                  className={`overflow-hidden ml-1 tooltip-queue-${call?.queue}`}
                >
                  {' '}
                  <FontAwesomeIcon
                    icon={BadgeIcon}
                    className="h-4 w-4 mr-2 ml-1"
                    aria-hidden="true"
                  />
                  <div className={`truncate ${call?.queue ? 'w-20 lg:w-16 xl:w-20' : ''}`}>
                    {queues?.[call.queue!]?.name
                      ? queues?.[call.queue!]?.name + ' ' + call?.queue
                      : t('QueueManager.Queue')}
                  </div>
                </Badge>
                <Tooltip anchorSelect={`.tooltip-queue-${call?.queue}`}>
                  {queues?.[call.queue!]?.name
                    ? queues?.[call.queue!]?.name + ' ' + call?.queue
                    : t('QueueManager.Queue')}{' '}
                </Tooltip>
              </>
            )}
          </>
        )}

        {showCreateButton && (
          <Button
            variant="ghost"
            className="flex gap-3 items-center py-2 px-3 border dark:border-gray-700 border-gray-200 ml-auto dark:focus:ring-2 focus:ring-2 dark:focus:ring-blue-200 focus:ring-blue-500"
            onClick={() => handleSelectedMissedCall(call.cnum, call.ccompany)}
          >
            <FontAwesomeIcon
              className="text-base dark:text-blue-500 text-blue-700"
              icon={AddUserIcon}
            />
            <p className="dark:text-blue-500 text-blue-700 font-medium">{t('SpeedDial.Create')}</p>
          </Button>
        )}
      </div>
    </div>
  )
}
