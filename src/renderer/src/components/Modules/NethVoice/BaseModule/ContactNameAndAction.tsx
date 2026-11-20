import { NumberCaller } from '../../../NumberCaller'
import { ContactType } from '@shared/types'
import { debouncer, isDev, isVideoCapableExtension } from '@shared/utils/utils'
import { FavouriteStar } from './FavouritesStar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAccount } from '@renderer/hooks/useAccount'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useIsTruncated } from '@renderer/hooks/useIsTruncated'
import { Avatar } from '../../../Nethesis'
import { CustomThemedTooltip } from '../../../Nethesis/CustomThemedTooltip'
import {
  faPhone as CallIcon,
  faVideo as VideoCallIcon,
  faBriefcase as CompanyIcon,
} from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import { ReactNode } from 'react'
import classNames from 'classnames'
export const ContactNameAndActions = ({
  contact,
  number,
  isHighlight,
  displayedNumber,
  otherNumber,
  avatarDim,
  username,
  isFavourite,
  isSearchData,
  onOpenDetail,
  showCompany = false,
}: {
  contact: ContactType
  number: string
  isHighlight: boolean
  displayedNumber: string | ReactNode[]
  otherNumber?: string
  avatarDim: 'small' | 'base' | 'extra_small' | 'large' | 'extra_large'
  username: string | undefined
  isFavourite: boolean
  isSearchData: boolean
  onOpenDetail?: () => void
  showCompany?: boolean
}) => {
  const { isCallsEnabled } = useAccount()
  const [operators] = useNethlinkData('operators')
  const { callNumber } = usePhoneIslandEventHandler()
  const avatarSrc = username && operators?.avatars?.[username]

  const isOperator = username && !!operators?.operators?.[username]

  const operatorPresence = isOperator
    ? operators?.operators?.[username!]?.mainPresence
    : undefined
  const isOperatorOnline =
    !isOperator ||
    operatorPresence === 'online' ||
    operatorPresence === 'available'
  const isCallDisabled = !isCallsEnabled || !isOperatorOnline
  // Search results hide the call icons, except for an operator
  const showCallIcons = !isHighlight || !!isOperator
  const [account] = useSharedState('account')
  const [cameraPermission] = useSharedState('cameraPermission')
  // Video calls start from the NethLink WebRTC device and need a video-capable device on the other side
  const canVideoCall =
    isOperator &&
    ['nethlink', 'webrtc'].includes(
      account?.data?.default_device?.type || '',
    ) &&
    (operators?.operators?.[username!]?.endpoints?.extension || []).some(
      isVideoCapableExtension,
    )

  // Without the camera permission the call would not start at all
  const isCameraDenied = cameraPermission === false
  const isVideoCallDisabled = isCallDisabled || isCameraDenied

  const isDisplayedNumberEmpty =
    displayedNumber === null ||
    displayedNumber === undefined ||
    (Array.isArray(displayedNumber)
      ? displayedNumber.length === 0
      : displayedNumber.length === 0)

  const onClick = (e) => {
    if (onOpenDetail) {
      e.stopPropagation()
      e.preventDefault()
      onOpenDetail()
    }
  }

  const displayName = isFavourite
    ? contact.company && contact.company !== ' '
      ? contact.company
      : `${t('Common.Unknown')}`
    : contact.name && contact.name !== ' ' && contact.name !== '-'
      ? contact.name
      : contact.company && contact.company !== ' '
        ? contact.company
        : `${t('Common.Unknown')}`

  // Show a company line under the name/number only in search results for person
  const hasCompanyLine =
    showCompany &&
    contact.kind !== 'company' &&
    !!contact.company &&
    contact.company !== ' ' &&
    contact.company !== '-' &&
    contact.company !== displayName

  // Attach tooltips only when the text is actually truncated
  const [nameRef, isNameTruncated] = useIsTruncated<HTMLButtonElement>([
    displayName,
  ])
  const [companyRef, isCompanyTruncated] = useIsTruncated<HTMLSpanElement>([
    contact.company,
  ])
  const [numberRef, isNumberTruncated] = useIsTruncated<HTMLDivElement>([
    number,
    otherNumber,
  ])

  const nameTooltipId = `tooltip-view-details-${contact.id}`
  const nameTooltipContent = isNameTruncated
    ? displayName
    : onOpenDetail
      ? (t('Phonebook.View details') as string)
      : undefined
  const companyTooltipId = `tooltip-company-${contact.id}`
  const numberTooltipId = `tooltip-number-${contact.id}`
  const videoCallTooltipId = `tooltip-video-call-${contact.id}`
  const callTooltipId = `tooltip-call-${contact.id}`
  // the name opens the details, when the row has them
  const NameTag = onOpenDetail ? 'button' : 'div'

  return (
    <div className='flex w-full max-w-full flex-row items-center gap-3'>
      <Avatar
        size={avatarDim}
        src={avatarSrc}
        status={
          isOperator
            ? operators?.operators?.[username]?.mainPresence
            : undefined
        }
        bordered={true}
        placeholderType={
          operators?.extensions[contact?.speeddial_num || '']
            ? 'operator'
            : contact?.kind === 'company'
              ? 'company'
              : 'person'
        }
        className={classNames('border', onOpenDetail ? 'cursor-pointer' : '')}
        onClick={onClick}
      />
      <div
        className={classNames(
          'relative min-w-0 flex-1',
          hasCompanyLine ? '' : 'h-11',
        )}
      >
        <div
          className={classNames(
            'flex flex-col gap-1 w-full min-w-0',
            hasCompanyLine ? '' : 'absolute top-0 left-0',
          )}
        >
          <div className='flex flex-row gap-2 w-full overflow-hidden'>
            <NameTag
              ref={nameRef as any}
              type={onOpenDetail ? 'button' : undefined}
              className={classNames(
                'min-w-0 truncate whitespace-nowrap text-left text-sm font-medium text-titleLight dark:text-titleDark',
                onOpenDetail
                  ? 'rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:focus-visible:ring-primaryRingDark'
                  : '',
              )}
              onClick={onOpenDetail ? onClick : undefined}
              data-tooltip-id={nameTooltipContent ? nameTooltipId : undefined}
              data-tooltip-content={nameTooltipContent}
            >
              {nameTooltipContent && (
                <CustomThemedTooltip id={nameTooltipId} place='top' />
              )}
              {displayName}
              {isDev() && (
                <span
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify({
                        contact,
                        number,
                        isHighlight,
                        displayedNumber,
                        avatarDim,
                        username,
                        isFavourite,
                        isSearchData,
                      }),
                    )
                  }}
                  className='absolute top-[-4px] left-[-26px] text-[8px] cursor-pointer'
                >
                  [{contact.id}]
                </span>
              )}
            </NameTag>
            {isOperator && (
              <FavouriteStar contact={contact} isSearchData={isSearchData} />
            )}
          </div>
          <div className='flex flex-row gap-2 items-center w-full min-w-0'>
            {showCallIcons && (
              <>
                <button
                  type='button'
                  disabled={isCallDisabled}
                  aria-label={t('Operators.Call') as string}
                  data-tooltip-id={callTooltipId}
                  data-tooltip-content={t('Operators.Call') as string}
                  className={classNames(
                    'flex shrink-0 items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:focus-visible:ring-primaryRingDark',
                    isCallDisabled
                      ? 'cursor-not-allowed text-gray-500 dark:text-gray-400'
                      : 'text-gray-600 hover:text-textBlueLight dark:text-gray-400 dark:hover:text-textBlueDark',
                  )}
                  onClick={() => {
                    if (isCallDisabled) return
                    debouncer(
                      'onCallNumber',
                      () => {
                        callNumber(number)
                      },
                      250,
                    )
                  }}
                >
                  <FontAwesomeIcon
                    className='size-4'
                    icon={CallIcon}
                    aria-hidden='true'
                  />
                </button>
                <CustomThemedTooltip id={callTooltipId} place='top' />
              </>
            )}
            {showCallIcons && canVideoCall && (
              <>
                <button
                  type='button'
                  disabled={isVideoCallDisabled}
                  aria-label={
                    (isCameraDenied
                      ? t('Operators.Enable camera permission')
                      : t('Operators.Video call')) as string
                  }
                  data-tooltip-id={videoCallTooltipId}
                  data-tooltip-content={
                    (isCameraDenied
                      ? t('Operators.Enable camera permission')
                      : t('Operators.Video call')) as string
                  }
                  className={classNames(
                    'flex shrink-0 items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:focus-visible:ring-primaryRingDark',
                    isVideoCallDisabled
                      ? 'cursor-not-allowed text-gray-500 dark:text-gray-400'
                      : 'text-gray-600 hover:text-textBlueLight dark:text-gray-400 dark:hover:text-textBlueDark',
                  )}
                  onClick={() => {
                    if (isVideoCallDisabled) return
                    debouncer(
                      'onVideoCallNumber',
                      () => {
                        callNumber(number, { video: true })
                      },
                      250,
                    )
                  }}
                >
                  <FontAwesomeIcon
                    className='size-4'
                    icon={VideoCallIcon}
                    aria-hidden='true'
                  />
                </button>
                <CustomThemedTooltip id={videoCallTooltipId} place='top' />
              </>
            )}
            <div className='flex flex-row items-center min-w-0 flex-1'>
              <div
                ref={numberRef}
                className='min-w-0 truncate'
                data-tooltip-id={
                  isNumberTruncated ? numberTooltipId : undefined
                }
                data-tooltip-content={isNumberTruncated ? number : undefined}
              >
                <NumberCaller
                  number={number}
                  disabled={isDisplayedNumberEmpty || isCallDisabled}
                  className={classNames(
                    isDisplayedNumberEmpty
                      ? 'text-gray-600 dark:text-gray-400'
                      : isCallDisabled
                        ? 'dark:text-gray-400 text-gray-500'
                        : 'dark:text-textBlueDark text-textBlueLight hover:text-primaryHover dark:hover:text-primaryDarkHover',
                    'font-normal',
                    isDisplayedNumberEmpty || isCallDisabled
                      ? ''
                      : 'hover:underline',
                  )}
                >
                  {displayedNumber !== ' ' &&
                  displayedNumber !== '' &&
                  displayedNumber !== null &&
                  (!Array.isArray(displayedNumber) ||
                    displayedNumber.length > 0)
                    ? displayedNumber
                    : t('Phonebook.No phone number')}
                </NumberCaller>
              </div>
              {isNumberTruncated && (
                <CustomThemedTooltip id={numberTooltipId} place='top' />
              )}
              {otherNumber && (
                <button
                  type='button'
                  onClick={onClick}
                  className='ml-2 shrink-0 rounded text-sm text-textBlueLight hover:text-primaryHover hover:underline dark:text-textBlueDark dark:hover:text-primaryDarkHover focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:focus-visible:ring-primaryRingDark'
                >
                  {otherNumber}
                </button>
              )}
            </div>
          </div>
          {hasCompanyLine && (
            <div className='flex flex-row gap-2 items-center w-full overflow-hidden'>
              <FontAwesomeIcon
                className='size-4 shrink-0 text-gray-600 dark:text-gray-400'
                icon={CompanyIcon}
                aria-hidden='true'
              />
              <span
                ref={companyRef}
                className='min-w-0 flex-1 truncate text-sm text-gray-600 dark:text-gray-400'
                data-tooltip-id={
                  isCompanyTruncated ? companyTooltipId : undefined
                }
                data-tooltip-content={
                  isCompanyTruncated ? contact.company : undefined
                }
              >
                {contact.company}
              </span>
              {isCompanyTruncated && (
                <CustomThemedTooltip id={companyTooltipId} place='top' />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
