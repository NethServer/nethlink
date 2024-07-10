import { ReactNode } from 'react'
import { t } from 'i18next'
import { OperatorData, SearchData } from '@shared/types'
import { faCircleUser as DefaultAvatar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAccount } from '@renderer/hooks/useAccount'
import { useStoreState } from '@renderer/store'
import { Avatar, Button } from '@renderer/components/Nethesis'
import { NumberCaller } from '@renderer/components/NumberCaller'
import { usePhonebookSearchModule } from './hook/usePhoneBookSearchModule'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { log } from '@shared/utils/logger'

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
        <div className="flex gap-3 items-center">
          {avatarSrc && user.isOperator ? (
            <Avatar
              size="small"
              src={avatarSrc}
              status={username ? operators?.operators?.[username]?.mainPresence : undefined}
              bordered={true}
            />
          ) : (
            <div className="flex items-center justify-center relative shrink-0 h-8 w-8 text-sm rounded-full border-2 border-borderLight dark:border-borderDark">
              <FontAwesomeIcon
                icon={DefaultAvatar}
                className="text-[28px] dark:text-gray-50 text-gray-600"
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <p className="font-normal text-[14px] leading-5 dark:text-titleDark text-titleLight">
              {user.name}
            </p>
            <NumberCaller
              number={phoneNumber}
              disabled={!isCallsEnabled}
              className="dark:text-textBlueDark text-textBlueLight text-[1rem] hover:underline mr-auto"
            >
              {highlightedNumber}
            </NumberCaller>
          </div>
        </div>
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
