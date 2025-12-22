import {
  faUserPlus as AddUserIcon,
  faUsers as BadgeIcon,
  faCircleUser,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Avatar, Button } from '../../../Nethesis'
import { NumberCaller } from '../../../NumberCaller'
import { useEffect, useState } from 'react'
import { LastCallData } from '@shared/types'
import { t } from 'i18next'
import { CallsDate } from '../../../Nethesis/CallsDate'
import { truncate } from '@renderer/utils'
import { Tooltip } from 'react-tooltip'
import { Badge } from '../../../Nethesis/Badge'
import { useAccount } from '@renderer/hooks/useAccount'
import { useNethlinkData } from '@renderer/store'
import { usePhonebookModule } from '../PhonebookModule/hook/usePhonebookModule'
import {
  OutCallAnsweredIcon,
  OutCallNotAnsweredIcon,
  InCallAnsweredIcon,
  InCallNotAnsweredIcon,
} from '@renderer/icons'
import classNames from 'classnames'

export interface LastCallProps {
  call: LastCallData
  showContactForm: () => void
  showCreateButton?: boolean
  className?: string
}

export function LastCall({
  call,
  showContactForm,
  showCreateButton = false,
  className,
}: LastCallProps): JSX.Element {
  const phonebookModule = usePhonebookModule()
  const [, setSelectedContact] = phonebookModule.selectedContact
  const [queues] = useNethlinkData('queues')
  const [operators] = useNethlinkData('operators')
  const { isCallsEnabled } = useAccount()
  const [isQueueLoading, setIsQueueLoading] = useState<boolean>(true)
  const avatarSrc = operators?.avatars?.[call.username]

  function getOperatorByPhoneNumber(phoneNumber: string, operators: any) {
    return Object.values(operators).find(
      (extensions: any) => extensions.id === phoneNumber,
    )
  }

  if (call?.dst_cnam === '') {
    const operatorFound: any = getOperatorByPhoneNumber(
      call?.dst as string,
      operators?.operators || {},
    )

    if (operatorFound) {
      call.dst_cnam = operatorFound?.name || operatorFound?.company
    }
  }

  useEffect(() => {
    if (isQueueLoading && queues !== undefined) {
      setIsQueueLoading(() => false)
    }
  }, [queues])

  const handleSelectedCallContact = (
    number: string,
    company: string | undefined,
  ) => {
    if (company === undefined) {
      setSelectedContact({ number, company: '' })
    } else setSelectedContact({ number, company })
  }

  const handleCreateContact = () => {
    handleSelectedCallContact(
      (call.direction === 'in' ? call.src : call.dst) || '',
      call.direction === 'in'
        ? call?.cnam || call?.ccompany
        : call.direction === 'out'
          ? call?.dst_cnam || call?.dst_ccompany
          : undefined,
    )
    showContactForm()
  }

  const getCallName = (call: LastCallData) => {
    return `${
      call.direction === 'in'
        ? call.cnam || call.ccompany || t('Common.Unknown')
        : call.direction === 'out'
          ? call.dst_cnam || call.dst_ccompany || t('Common.Unknown')
          : t('Common.Unknown')
    }`
  }

  const tooltipId = call.uniqueid?.replace('.', '_')
  const isFromQueue = Boolean(call.channel?.includes('from-queue'))

  return (
    <div
      className='group'
    >
      <div
        className={`flex flex-grow gap-3 min-h-[72px] py-6 px-3 ${className}`}
      >
        {call.hasNotification && (
          <div className={`relative w-0 h-0 z-0 overflow-visible mr-[-12px]`}>
            <div
              className={`relative w-4 h-4 left-[-16px] dark:bg-textBlueDark bg-textBlueLight rounded-full border-2 dark:border-bgDark border-bgLight`}
            />
          </div>
        )}
        <div className='flex flex-col h-full min-w-6 pt-[6px] z-10'>
          {avatarSrc ? (
            <Avatar
              size='small'
              src={avatarSrc}
              status={operators?.operators?.[call.username]?.mainPresence}
            />
          ) : (
            <FontAwesomeIcon
              icon={faCircleUser}
              className='h-8 w-8 dark:text-gray-200 text-gray-400'
            />
          )}
        </div>
        <div className='flex flex-col gap-1 dark:text-titleDark text-titleLight'>
          <p
            className={`font-medium text-[14px] leading-5`}
            data-tooltip-id={`tooltip-username-${tooltipId}`}
            data-tooltip-content={getCallName(call)}
          >
            {truncate(getCallName(call), 24)}
          </p>
          <Tooltip
            id={`tooltip-username-${tooltipId}`}
            place='bottom'
            opacity={1}
            className='z-10'
          />

          {isFromQueue && (
            <div>
              {isQueueLoading ? (
                <Badge
                  variant='offline'
                  rounded='full'
                  className={`animate-pulse overflow-hidden w-[108px] min-h-4`}
                ></Badge>
              ) : (
                <Badge
                  size='small'
                  variant='offline'
                  rounded='full'
                  className={`overflow-hidden`}
                  data-tooltip-id={`tooltip-queue-${tooltipId}`}
                  data-tooltip-content={
                    queues?.[call.queue!]?.name
                      ? queues?.[call.queue!]?.name + ' ' + call?.queue
                      : t('QueueManager.Queue')
                  }
                >
                  <FontAwesomeIcon
                    icon={BadgeIcon}
                    className='h-4 w-4 mr-2 ml-1'
                    aria-hidden='true'
                  />
                  <div className='truncate max-w-40 sm:max-w-96 lg:max-w-screen-sm 2xl:max-w-screen-lg mr-1'>
                    {queues?.[call.queue!]?.name
                      ? queues?.[call.queue!]?.name + ' ' + call?.queue
                      : t('QueueManager.Queue')}
                  </div>
                  <Tooltip
                    id={`tooltip-queue-${tooltipId}`}
                    place='bottom'
                    className='z-[10]'
                    opacity={1}
                  />
                </Badge>
              )}
            </div>
          )}

          <div
            className='flex flex-row gap-2 items-center'
            data-tooltip-id={`call_${tooltipId}`}
            data-tooltip-content={
              call.disposition === 'NO ANSWER'
                ? call.direction === 'in'
                  ? t('History.Incoming missed')
                  : t('History.Outgoing missed')
                : call.direction === 'in'
                  ? t('History.Incoming answered')
                  : t('History.Outgoing answered')
            }
          >
            <div className={`h-4 w-4`}>
              {call.disposition === 'NO ANSWER' ? (
                call.direction === 'in' ? (
                  <InCallNotAnsweredIcon />
                ) : (
                  <OutCallNotAnsweredIcon />
                )
              ) : call.direction === 'in' ? (
                <InCallAnsweredIcon />
              ) : (
                <OutCallAnsweredIcon />
              )}
            </div>
            <Tooltip
              id={`call_${tooltipId}`}
              place='right'
              className='z-10'
              opacity={1}
              noArrow={false}
            />
            <NumberCaller
              number={
                (call.direction === 'in' ? call.src : call.dst) || 'no number'
              }
              disabled={!isCallsEnabled}
              className={
                'dark:text-textBlueDark text-textBlueLight font-normal text-[14px] leading-5 hover:underline inset-pink-600'
              }
              isNumberHiglighted={false}
            >
              {(call.direction === 'in' ? call.src : call.dst) ||
                t('Common.Unknown')}
            </NumberCaller>
          </div>

          <CallsDate call={call} inline={true} />
        </div>

        <div className='flex flex-col justify-between ml-auto items-center'>
          {showCreateButton && (
            <div className={classNames('flex relative right-[-8px] h-full')}>
              <div className={classNames('absolute right-0')}>
                <Button
                  variant='ghost'
                  className='group/add-contact flex gap-3 items-center py-2 px-2 border dark:border-borderDark border-borderLight ml-auto hover:bg-primaryHover/10 dark:hover:bg-primaryDarkHover/10'
                  onClick={handleCreateContact}
                  size='base_square'
                >
                  <FontAwesomeIcon
                    className='text-base dark:text-textBlueDark text-textBlueLight group-hover/add-contact:text-primaryHover dark:group-hover/add-contact:text-primaryDarkHover'
                    icon={AddUserIcon}
                  />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
