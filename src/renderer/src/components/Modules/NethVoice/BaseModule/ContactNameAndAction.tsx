import { NumberCaller } from '../../../NumberCaller'
import { ContactType } from '@shared/types'
import { debouncer, isDev } from '@shared/utils/utils'
import { FavouriteStar } from './FavouritesStar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAccount } from '@renderer/hooks/useAccount'
import { useNethlinkData } from '@renderer/store'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useIsTruncated } from '@renderer/hooks/useIsTruncated'
import { Avatar } from '../../../Nethesis'
import { CustomThemedTooltip } from '../../../Nethesis/CustomThemedTooltip'
import { faPhone as CallIcon, faBriefcase as CompanyIcon } from '@fortawesome/free-solid-svg-icons'
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
  const [nameRef, isNameTruncated] = useIsTruncated<HTMLDivElement>([displayName])
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

  return (
    <div
      className={classNames(
        avatarDim === 'small' ? 'gap-3' : 'gap-6',
        'flex flex-row items-center w-full max-w-full',
      )}
    >
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
        className={classNames(
          'border-[1px]',
          onOpenDetail
            ? 'cursor-pointer dark:hover:border-bgLight hover:border-bgDark'
            : '',
        )}
        onClick={onClick}
      />
      <div className={classNames('relative min-w-0 flex-1', hasCompanyLine ? '' : 'h-[44px]')}>
        <div className={classNames('flex flex-col gap-1 w-full min-w-0', hasCompanyLine ? '' : 'absolute top-0 left-0')}>
          <div className='flex flex-row gap-2 w-full overflow-hidden'>
            <div
              ref={nameRef}
              className={classNames(
                'min-w-0 flex-1 dark:text-titleDark text-titleLight font-medium text-[14px] leading-5 truncate break-all whitespace-nowrap ',
                onOpenDetail ? 'cursor-pointer hover:underline' : '',
              )}
              onClick={onClick}
              data-tooltip-id={nameTooltipContent ? nameTooltipId : undefined}
              data-tooltip-content={nameTooltipContent}
            >
              {nameTooltipContent && (
                <CustomThemedTooltip id={nameTooltipId} place="top" />
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
            </div>
            {isOperator && (
              <FavouriteStar contact={contact} isSearchData={isSearchData} />
            )}
          </div>
          <div className='flex flex-row gap-2 items-center w-full min-w-0'>
            {!isHighlight && (
              <FontAwesomeIcon
                className={classNames(
                  'text-base',
                  isCallDisabled
                    ? 'dark:text-gray-400 text-gray-500 cursor-not-allowed'
                    : 'dark:text-gray-400 text-gray-600 cursor-pointer hover:dark:text-textBlueDark hover:text-textBlueLight',
                )}
                icon={CallIcon}
                onClick={() => {
                  if (isCallDisabled) return
                  debouncer(
                    'onCallNumber',
                    () => {
                      callNumber(contact.speeddial_num!)
                    },
                    250,
                  )
                }}
              />
            )}
            <div className='flex flex-row items-center min-w-0 flex-1'>
              <div
                ref={numberRef}
                className='min-w-0 truncate'
                data-tooltip-id={isNumberTruncated ? numberTooltipId : undefined}
                data-tooltip-content={isNumberTruncated ? number : undefined}
              >
                <NumberCaller
                  number={number}
                  disabled={isDisplayedNumberEmpty || isCallDisabled}
                  className={classNames(
                    isDisplayedNumberEmpty
                      ? ''
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
                  (!Array.isArray(displayedNumber) || displayedNumber.length > 0)
                    ? displayedNumber
                    : '-'}
                </NumberCaller>
              </div>
              {isNumberTruncated && (
                <CustomThemedTooltip id={numberTooltipId} place='top' />
              )}
              {otherNumber && (
                <span
                  onClick={onClick}
                  className='ml-2 shrink-0 cursor-pointer hover:underline dark:text-textBlueDark text-textBlueLight hover:text-primaryHover dark:hover:text-primaryDarkHover'
                >
                  {otherNumber}
                </span>
              )}
            </div>
          </div>
          {hasCompanyLine && (
            <div className='flex flex-row gap-2 items-center w-full overflow-hidden'>
              <FontAwesomeIcon
                className='text-sm dark:text-gray-400 text-gray-600 shrink-0'
                icon={CompanyIcon}
              />
              <span
                ref={companyRef}
                className='min-w-0 flex-1 dark:text-gray-400 text-gray-600 font-normal text-[14px] leading-5 truncate'
                data-tooltip-id={isCompanyTruncated ? companyTooltipId : undefined}
                data-tooltip-content={isCompanyTruncated ? contact.company : undefined}
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
