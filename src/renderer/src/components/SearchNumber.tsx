import { ReactNode, useEffect } from 'react'
import { Avatar, Button } from './Nethesis'
import { NumberCaller } from './NumberCaller'
import { PlaceholderIcon } from '@renderer/icons/PlaceholderIcon'
import { t } from 'i18next'
import { OperatorData, SearchData } from '@shared/types'
import { useSubscriber } from '@renderer/hooks/useSubscriber'
import { log } from '@shared/utils/logger'

export interface SearchNumberProps {
  user: SearchData
  callUser: (phoneNumber: string) => void
  searchText: string
}

export function SearchNumber({ user, callUser, searchText }: SearchNumberProps) {
  const operators = useSubscriber<OperatorData>('operators')

  const getUsernameFromPhoneNumber = (number: string) => {
    return operators.extensions[number]?.username
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
          <span className="dark:text-blue-500 text-blue-600 font-semibold">
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

  const phoneNumber = user.workphone || user.cellphone || user.extension
  const highlightedNumber = highlightMatch(phoneNumber, searchText)

  const username = getUsernameFromPhoneNumber(phoneNumber)
  const avatarSrc = operators?.avatars?.[username]

  return (
    <div className="flex justify-between w-full min-h-14 py-2 px-5 dark:text-gray-50 text-gray-900">
      <div className="flex gap-3 items-center">
        <Avatar
          size="small"
          src={avatarSrc}
          status={operators?.operators?.[username]?.mainPresence || undefined}
          placeholder={!avatarSrc ? PlaceholderIcon : undefined}
          bordered={true}
        />
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{user.name}</p>
          <NumberCaller
            number={phoneNumber}
            className="dark:text-blue-500 text-blue-600 font-normal underline"
          >
            {highlightedNumber}
          </NumberCaller>
        </div>
      </div>
      <Button
        className="dark:hover:bg-gray-900 hover:bg-gray-50"
        variant="ghost"
        onClick={() => {
          callUser(phoneNumber)
        }}
      >
        <p className="dark:text-blue-500 text-blue-600 font-semibold">{t('Operators.Call')}</p>
      </Button>
    </div>
  )
}
