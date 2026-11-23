import { ReactNode } from 'react'
import { t } from 'i18next'
import { SearchData } from '@shared/types'
import { useNethlinkData } from '@renderer/store'
import { Button } from '@renderer/components/Nethesis'
import { usePhonebookSearchModule } from './hook/usePhoneBookSearchModule'
import { ContactNameAndActions } from '@renderer/components/Modules/NethVoice/BaseModule/ContactNameAndAction'
import { useFavouriteModule } from '../Speeddials/hook/useFavouriteModule'
import { ClassNames } from '@renderer/utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMessage, faEye } from '@fortawesome/free-solid-svg-icons'
import { openChat } from '@renderer/hooks/useChatBridge'
import { CustomThemedTooltip } from '@renderer/components/Nethesis/CustomThemedTooltip'

export interface SearchNumberProps {
  user: SearchData
  className?: string
  onClick?: (user: SearchData, primaryNumber: string | null) => void
}

export function SearchNumber({ user, className, onClick }: SearchNumberProps) {
  const phoneBookModule = usePhonebookSearchModule()
  const [searchText] = phoneBookModule.searchTextState
  const [operators] = useNethlinkData('operators')
  const [chatStatus] = useNethlinkData('chatStatus')
  const { isSearchAlsoAFavourite } = useFavouriteModule()

  const getUsernameFromPhoneNumber = (number: string) => {
    return user.type !== 'extension'
      ? operators?.extensions[number]?.username
      : undefined
  }

  function highlightMatch(
    number: string | undefined,
    searchText: string,
  ): ReactNode[] {
    const parts: ReactNode[] = []
    let lastIndex = 0
    if (number) {
      const lowerText = number.toLowerCase()
      const lowerSearchText = searchText.toLowerCase()
      let index = lowerText.indexOf(lowerSearchText)
      while (index !== -1) {
        parts.push(number.substring(lastIndex, index))
        parts.push(
          <span
            key={`highlight_${index}`}
            className='font-medium text-textBlueLight dark:text-textBlueDark'
          >
            {number.substring(index, index + searchText.length)}
          </span>,
        )
        lastIndex = index + searchText.length
        index = lowerText.indexOf(lowerSearchText, lastIndex)
      }

      parts.push(number.substring(lastIndex))
    }
    return parts
  }

  let phoneNumber: string | null = null
  const keys = [
    'extension',
    'cellphone',
    'homephone',
    'workphone',
    'workphone2',
    'cellphone2',
    'otherphone',
  ]

  for (const key of keys) {
    if (!phoneNumber) {
      phoneNumber = (user[key] || '').includes(`${searchText}`)
        ? user[key]
        : null
    } else {
      break
    }
  }

  phoneNumber =
    phoneNumber ||
    keys.reduce((p, c) => {
      if (p === '') p = user[c] || ''
      return p
    }, '')

  const highlightedNumber = highlightMatch(phoneNumber, searchText || '')
  const otherDevicesCount = Array.from(
    new Set(
      keys.map((k) => user[k]).filter((n): n is string => !!n && n !== ' '),
    ),
  ).filter((n) => n !== phoneNumber).length

  const username = getUsernameFromPhoneNumber(phoneNumber)
  const chatTooltipId = `tooltip-search-chat-${user.id}`

  return (
    <div className={ClassNames('group', className)}>
      <div className='flex min-h-14 w-full items-center justify-between gap-3 py-3 text-titleLight dark:text-titleDark'>
        <div className='min-w-0 flex-1'>
          <ContactNameAndActions
            avatarDim='small'
            contact={user}
            number={phoneNumber}
            displayedNumber={highlightedNumber}
            otherNumber={
              otherDevicesCount > 0
                ? (t('Common.PlusOther', {
                    count: otherDevicesCount,
                  }) as string)
                : ''
            }
            isHighlight={true}
            username={username}
            isFavourite={false}
            isSearchData={true}
            showCompany={true}
            onOpenDetail={
              onClick
                ? () => {
                    onClick?.(user, phoneNumber)
                  }
                : undefined
            }
          />
        </div>
        {/* An operator: chat with them */}
        {username && chatStatus === 'online' && (
          <>
            <Button
              variant='ghost'
              className='shrink-0 p-2'
              aria-label={t('Chat.Chat') as string}
              data-tooltip-id={chatTooltipId}
              data-tooltip-content={t('Chat.Chat') as string}
              onClick={() => openChat(username)}
            >
              <FontAwesomeIcon
                icon={faMessage}
                className='size-4'
                aria-hidden='true'
              />
            </Button>
            <CustomThemedTooltip id={chatTooltipId} place='left' />
          </>
        )}
        {onClick && (
          <Button
            variant='tertiary'
            className='shrink-0 gap-2'
            aria-label={
              t('Phonebook.Details contact', {
                name: user.displayName || user.name || user.company || '',
              }) as string
            }
            onClick={() => onClick(user, phoneNumber)}
          >
            <FontAwesomeIcon
              icon={faEye}
              className='size-4'
              aria-hidden='true'
            />
            {t('Phonebook.Details')}
          </Button>
        )}
      </div>
    </div>
  )
}
