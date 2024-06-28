import {
  faUserPlus as AddUserIcon,
  faUsers as BadgeIcon,
  faCircleUser
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Avatar, Button } from '../../../Nethesis'
import { NumberCaller } from '../../../NumberCaller'
import { useEffect, useState } from 'react'
import { Account, CallData, ContactType, LastCallData, OperatorData, QueuesType } from '@shared/types'
import { t } from 'i18next'
import { CallsDate } from '../../../Nethesis/CallsDate'
import { truncate } from '@renderer/utils'
import { Tooltip } from 'react-tooltip'
import { Badge } from '../../../Nethesis/Badge'
import { useAccount } from '@renderer/hooks/useAccount'
import { useStoreState } from '@renderer/store'
import { usePhonebookModule } from '../PhonebookModule/hook/usePhonebookModule'
import { InCallIcon, LostCallIcon, OutCallIcon } from '@renderer/icons'
import { log } from '@shared/utils/logger'

export interface LastCallProps {
  call: LastCallData
  showContactForm: () => void
  clearNotification: (call: LastCallData) => void
  className?: string
}

export function LastCall({
  call,
  showContactForm,
  clearNotification,
  className
}: LastCallProps): JSX.Element {
  const phonebookModule = usePhonebookModule()
  const [selectedContact, setSelectedContact] = phonebookModule.selectedContact
  const [queues] = useStoreState<QueuesType>('queues')
  const [operators] = useStoreState<OperatorData>('operators')
  const { isCallsEnabled } = useAccount()
  const [showCreateButton, setShowCreateButton] = useState<boolean>(false)
  const [isQueueLoading, setIsQueueLoading] = useState<boolean>(true)
  const avatarSrc = operators?.avatars?.[call.username]

  function getOperatorByPhoneNumber(phoneNumber: string, operators: any) {
    return Object.values(operators).find((extensions: any) => extensions.id === phoneNumber)
  }

  if (call?.dst_cnam === '') {
    const operatorFound: any = getOperatorByPhoneNumber(call?.dst as string, operators?.operators || {})

    if (operatorFound) {
      call.dst_cnam = operatorFound?.name || operatorFound?.company
    }
  }

  useEffect(() => {
    if (isQueueLoading && queues !== undefined) {
      setIsQueueLoading(() => false)
    }
  }, [queues])

  const handleSelectedCallContact = (number: string, company: string | undefined) => {
    if (company === undefined) {
      setSelectedContact({ number, company: '' })
    } else setSelectedContact({ number, company })
  }

  const handleCreateContact = () => {
    handleSelectedCallContact(call.cnum || '', call.ccompany)
    showContactForm()
  }

  return (
    <div
      className={`flex flex-grow gap-3 min-h-[72px] p-2 px-5 ${className}`}
      onMouseEnter={() => {
        if (call.username === t('Common.Unknown')) {
          setShowCreateButton(() => true)
        }
      }}
      onMouseLeave={() => setShowCreateButton(() => false)}
      onClick={() => {
        clearNotification(call)
      }}
    >
      {call.hasNotification && <div className={`relative w-0 h-0 z-0 overflow-visible mr-[-12px]`}>
        <div className={`relative w-4 h-4 left-[-16px] dark:bg-textBlueDark bg-textBlueLight rounded-full border-2 dark:border-gray-900 border-gray-50`} />
      </div>}
      <div className="flex flex-col h-full min-w-6 pt-[6px] z-10">
        {avatarSrc ? (
          <Avatar
            size="small"
            src={avatarSrc}
            status={operators?.operators?.[call.username]?.mainPresence}
          />
        ) : (
          <FontAwesomeIcon
            icon={faCircleUser}
            className="h-8 w-8 dark:text-gray-200 text-gray-400"
          />
        )}
      </div>
      <div className="flex flex-col gap-1 dark:text-titleDark text-titleLight">
        <p className="font-medium text-[14px] leading-5">{truncate(call.username, 15)}</p>
        <div className="flex flex-row gap-2 items-center">
          {call.direction === 'in' ? (call.disposition === 'NO ANSWER' ? <LostCallIcon /> : <InCallIcon />) : <OutCallIcon />}
          <NumberCaller
            number={(call.direction === 'in' ? call.src : call.dst) || 'no number'}
            disabled={!isCallsEnabled}
            className={"dark:text-textBlueDark text-textBlueLight font-normal text-[14px] leading-5 hover:underline"}
          >
            {(call.direction === 'in' ? call.src : call.dst) || t('Common.Unknown')}
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
            className="flex gap-3 items-center py-2 px-3 border dark:border-borderDark border-borderLight ml-auto"
            onClick={handleCreateContact}
          >
            <FontAwesomeIcon
              className="text-base dark:text-textBlueDark text-textBlueLight"
              icon={AddUserIcon}
            />
            <p className="dark:text-textBlueDark text-textBlueLight font-medium">
              {t('SpeedDial.Create')}
            </p>
          </Button>
        )}
      </div>
    </div >
  )
}
