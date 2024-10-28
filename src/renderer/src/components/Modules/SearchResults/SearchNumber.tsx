import { ReactNode } from 'react'
import { t } from 'i18next'
import { OperatorData, SearchData } from '@shared/types'
import { useAccount } from '@renderer/hooks/useAccount'
import { useStoreState } from '@renderer/store'
import { Button } from '@renderer/components/Nethesis'
import { usePhonebookSearchModule } from './hook/usePhoneBookSearchModule'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useFavouriteModule } from '../NethVoice/Speeddials/hook/useFavouriteModule'
import { ContactNameAndActions } from '@renderer/components/ContactNameAndAction'

export interface SearchNumberProps {
  user: SearchData
  className?: string
}

export function SearchNumber({ user, className }: SearchNumberProps) {
  const phoneBookModule = usePhonebookSearchModule()
  const { callNumber } = usePhoneIslandEventHandler()
  const [searchText] = phoneBookModule.searchTextState
  const [operators] = useStoreState<OperatorData>('operators')
  const { isCallsEnabled } = useAccount()
  const { isFavourite } = useFavouriteModule()

  const getUsernameFromPhoneNumber = (number: string) => {
    return operators?.extensions[number]?.username
  }

  function highlightMatch(number: string | undefined, searchText: string): ReactNode[] {
    const parts: ReactNode[] = []
    let lastIndex = 0
    if (number) {
      const lowerText = number.toLowerCase()
      const lowerSearchText = searchText.toLowerCase()
      let index = lowerText.indexOf(lowerSearchText)
      while (index !== -1) {
        parts.push(number.substring(lastIndex, index))
        parts.push(
          <span className="dark:text-textBlueDark text-textBlueLight font-medium text-[1rem]">
            {number.substring(index, index + searchText.length)}
          </span>
        )
        lastIndex = index + searchText.length
        index = lowerText.indexOf(lowerSearchText, lastIndex)
      }

      parts.push(number.substring(lastIndex))
    }
    return parts
  }

  let phoneNumber: string | null = null
  const keys = ['extension', 'cellphone', 'homephone', 'workphone']

  for (const key of keys) {
    if (!phoneNumber) {
      phoneNumber = (user[key] || '').includes(`${searchText}`) ? user[key] : null
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

  const username = getUsernameFromPhoneNumber(phoneNumber)
  const avatarSrc = username ? operators?.avatars?.[username] : ''

  return (
    <div className="group">
      <div className="flex justify-between w-full min-h-14 py-2 px-5 dark:text-titleDark text-titleDark dark:hover:bg-hoverDark hover:bg-hoverLight">
        <ContactNameAndActions
          avatarDim='small'
          contact={user}
          number={phoneNumber}
          displayedNumber={highlightedNumber}
          isHighlight={true}
          username={username}
          isFavourite={false}
        />
        <Button
          className="group-hover:bg-transparent"
          variant="ghost"
          disabled={!isCallsEnabled}
          onClick={() => {
            callNumber(phoneNumber!)
          }}
        >
          <p className="dark:text-textBlueDark text-textBlueLight font-medium text-[14px] leading-5">
            {t('Operators.Call')}
          </p>
        </Button>
      </div>
    </div>
  )
}
