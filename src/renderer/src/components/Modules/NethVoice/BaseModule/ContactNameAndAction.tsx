import { NumberCaller } from '../../../NumberCaller'
import { ContactType } from '@shared/types'
import { debouncer, isDev } from '@shared/utils/utils'
import { FavouriteStar } from './FavouritesStar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAccount } from '@renderer/hooks/useAccount'
import { useNethlinkData } from '@renderer/store'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { Avatar } from '../../../Nethesis'
import { faPhone as CallIcon } from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import { ReactNode } from 'react'
import classNames from 'classnames'
export const ContactNameAndActions = ({
  contact,
  number,
  isHighlight,
  displayedNumber,
  avatarDim,
  username,
  isFavourite,
  isSearchData
}: {
  contact: ContactType
  number: string
  isHighlight: boolean
  displayedNumber: string | ReactNode[]
  avatarDim: 'small' | 'base' | 'extra_small' | 'large' | 'extra_large'
  username: string | undefined
  isFavourite: boolean
  isSearchData: boolean
}) => {
  const { isCallsEnabled } = useAccount()
  const [operators] = useNethlinkData('operators')
  const { callNumber } = usePhoneIslandEventHandler()
  const avatarSrc = username && operators?.avatars?.[username]

  const isOperator = username && !!operators?.operators?.[username]

  return (
    <div
      className={classNames(
        avatarDim === 'small' ? 'gap-3' : 'gap-6',
        'flex flex-row items-center w-full max-w-full'
      )}
    >
      <Avatar
        size={avatarDim}
        src={avatarSrc}
        status={isOperator ? operators?.operators?.[username]?.mainPresence : undefined}
        bordered={true}
        placeholderType={
          operators?.extensions[contact?.speeddial_num || '']
            ? 'operator'
            : contact?.kind === 'company'
              ? 'company'
              : 'person'
        }
      />
      <div className="relative w-full h-[44px] ">
        <div className="absolute top-0 left-0 flex flex-col gap-1 w-full ">
          <div className="flex flex-row gap-2 w-full overflow-hidden">
            <div className="dark:text-titleDark text-titleLight font-medium text-[14px] leading-5 truncate break-all whitespace-nowrap ">
              {isFavourite
                ? contact.company || `${t('Common.Unknown')}`
                : contact.name || contact.company || `${t('Common.Unknown')}`}
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
                        isSearchData
                      })
                    )
                  }}
                  className="absolute top-[-4px] left-[-26px] text-[8px] cursor-pointer"
                >
                  [{contact.id}]
                </span>
              )}
            </div>
            {isOperator && <FavouriteStar contact={contact} isSearchData={isSearchData} />}
          </div>
          <div className="flex flex-row gap-2 items-center">
            {!isHighlight && (
              <FontAwesomeIcon
                className="dark:text-gray-400 text-gray-600 text-base"
                icon={CallIcon}
                onClick={() => {
                  debouncer('onCallNumber', () => {
                    callNumber(contact.speeddial_num!)
                  }, 250)
                }}
              />
            )}
            <NumberCaller
              number={number}
              disabled={displayedNumber?.length === 0 || !isCallsEnabled}
              className={`${displayedNumber?.length === 0 ? '' : 'dark:text-textBlueDark text-textBlueLight'}font-normal hover:underline`}
              isNumberHiglighted={isHighlight}
            >
              {displayedNumber !== ' ' &&
                displayedNumber !== '' &&
                displayedNumber !== null &&
                (!Array.isArray(displayedNumber) || displayedNumber.length > 0)
                ? displayedNumber
                : '-'}
            </NumberCaller>
          </div>
        </div>
      </div>
    </div>
  )
}
