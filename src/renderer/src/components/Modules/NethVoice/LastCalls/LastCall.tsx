import {
  faCirclePlus as AddUserIcon,
  faUsers as BadgeIcon,
  faCircleUser,
  faArrowLeft,
  faXmark,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { faMissed } from '@nethesis/nethesis-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Avatar, Button } from '../../../Nethesis'
import { NumberCaller } from '../../../NumberCaller'
import { useEffect, useState } from 'react'
import { LastCallData } from '@shared/types'
import { t } from 'i18next'
import { CallsDate } from '../../../Nethesis/CallsDate'
import { CustomThemedTooltip } from '../../../Nethesis/CustomThemedTooltip'
import { useIsTruncated } from '@renderer/hooks/useIsTruncated'
import { Badge } from '../../../Nethesis/Badge'
import { useAccount } from '@renderer/hooks/useAccount'
import { useNethlinkData } from '@renderer/store'
import { usePhonebookModule } from '../PhonebookModule/hook/usePhonebookModule'
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

  const callName = getCallName(call)
  const callNumberValue = (call.direction === 'in' ? call.src : call.dst) || ''
  const [nameRef, isNameTruncated] = useIsTruncated<HTMLParagraphElement>([
    callName,
  ])
  const [numberRef, isNumberTruncated] = useIsTruncated<HTMLDivElement>([
    callNumberValue,
  ])

  return (
    <div className='group'>
      <div
        className={classNames(
          'flex min-h-14 items-start gap-3 py-3',
          className,
        )}
      >
        <div className='relative flex shrink-0 flex-col pt-0.5'>
          {avatarSrc ? (
            <Avatar
              size='small'
              src={avatarSrc}
              status={operators?.operators?.[call.username]?.mainPresence}
            />
          ) : (
            <FontAwesomeIcon
              icon={faCircleUser}
              className='size-8 text-gray-400 dark:text-gray-200'
              aria-hidden='true'
            />
          )}
          {call.hasNotification && (
            <span className='absolute -left-0.5 -top-0.5 size-3 rounded-full border-2 border-bgLight bg-textBlueLight dark:border-bgDark dark:bg-textBlueDark'>
              <span className='sr-only'>{t('LastCalls.New call')}</span>
            </span>
          )}
        </div>
        <div className='flex flex-col gap-1 min-w-0 flex-1 dark:text-titleDark text-titleLight'>
          <p
            ref={nameRef}
            className='truncate text-sm font-medium leading-5'
            data-tooltip-id={
              isNameTruncated ? `tooltip-username-${tooltipId}` : undefined
            }
            data-tooltip-content={isNameTruncated ? callName : undefined}
          >
            {callName}
          </p>
          {isNameTruncated && (
            <CustomThemedTooltip
              id={`tooltip-username-${tooltipId}`}
              place='bottom'
              className='z-10'
            />
          )}

          {isFromQueue && (
            <div>
              {isQueueLoading ? (
                <Badge
                  variant='offline'
                  rounded='full'
                  className='min-h-4 w-28 animate-pulse overflow-hidden'
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
                  <CustomThemedTooltip
                    id={`tooltip-queue-${tooltipId}`}
                    place='bottom'
                    className='z-10'
                  />
                </Badge>
              )}
            </div>
          )}

          <div
            className='flex flex-row gap-2 items-center min-w-0'
            data-tooltip-id={`call_${tooltipId}`}
            data-tooltip-content={
              call.disposition === 'ANSWERED'
                ? call.direction === 'in'
                  ? t('History.Incoming answered')
                  : t('History.Outgoing answered')
                : call.direction === 'in'
                  ? t('History.Incoming missed')
                  : t('History.Outgoing missed')
            }
          >
            <div>
              {call.direction === 'in' && (
                <div>
                  {call.disposition === 'ANSWERED' ? (
                    <FontAwesomeIcon
                      icon={faArrowLeft}
                      className='size-4 -rotate-45 text-green-700 dark:text-green-500'
                      aria-hidden='true'
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faMissed as IconDefinition}
                      className='size-4 text-red-700 dark:text-red-500'
                      aria-hidden='true'
                    />
                  )}
                </div>
              )}
              {call.direction === 'out' && (
                <div>
                  {call.disposition === 'ANSWERED' ? (
                    <FontAwesomeIcon
                      icon={faArrowLeft}
                      className='size-4 rotate-[135deg] text-green-700 dark:text-green-500'
                      aria-hidden='true'
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faXmark}
                      className='size-4 text-red-700 dark:text-red-500'
                      aria-hidden='true'
                    />
                  )}
                </div>
              )}
            </div>
            <CustomThemedTooltip
              id={`call_${tooltipId}`}
              place='right'
              className='z-10'
            />
            <div
              ref={numberRef}
              className='min-w-0 truncate'
              data-tooltip-id={
                isNumberTruncated ? `tooltip-number-${tooltipId}` : undefined
              }
              data-tooltip-content={
                isNumberTruncated ? callNumberValue : undefined
              }
            >
              <NumberCaller
                number={
                  (call.direction === 'in' ? call.src : call.dst) ||
                  (t('Common.Unknown') as string)
                }
                disabled={!isCallsEnabled}
                className={
                  'text-sm font-normal leading-5 text-textBlueLight hover:text-primaryHover hover:underline dark:text-textBlueDark dark:hover:text-primaryDarkHover'
                }
              >
                {(call.direction === 'in' ? call.src : call.dst) ||
                  t('Common.Unknown')}
              </NumberCaller>
            </div>
            {isNumberTruncated && (
              <CustomThemedTooltip
                id={`tooltip-number-${tooltipId}`}
                place='bottom'
                className='z-10'
              />
            )}
          </div>

          <CallsDate call={call} inline={true} />
        </div>

        {showCreateButton && (
          <div className='ml-auto shrink-0 self-center'>
            {/* always visible, as the trailing action of the other rows */}
            <Button
              variant='ghost'
              className='p-2'
              aria-label={t('Phonebook.Create contact') ?? undefined}
              data-tooltip-id={`tooltip-create-contact-${tooltipId}`}
              data-tooltip-content={t('Phonebook.Create contact') ?? undefined}
              onClick={handleCreateContact}
            >
              <FontAwesomeIcon
                className='size-4'
                icon={AddUserIcon}
                aria-hidden='true'
              />
            </Button>
            <CustomThemedTooltip
              id={`tooltip-create-contact-${tooltipId}`}
              place='left'
            />
          </div>
        )}
      </div>
    </div>
  )
}
