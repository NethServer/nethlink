import {
  faPhone as CallIcon,
  faUserPlus as AddUserIcon,
  faSearch as EmptySearchIcon
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchNumber } from './SearchNumber'
import { useEffect, useState } from 'react'
import { BaseAccountData, SearchData } from '@shared/types'
import { t } from 'i18next'
import { useAccount } from '@renderer/hooks/useAccount'
import { cloneDeep } from 'lodash'
import { cleanRegex, getIsPhoneNumber, sortByProperty } from '@renderer/lib/utils'
import { useSharedState } from '@renderer/store'
import { usePhonebookSearchModule } from './hook/usePhoneBookSearchModule'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { Scrollable } from '@renderer/components/Scrollable'
import { EmptyList } from '@renderer/components/EmptyList'

interface SearchNumberBoxProps {
  searchResult: SearchData[] | undefined
  showContactForm: () => void
}
export function SearchNumberBox({ searchResult, showContactForm }: SearchNumberBoxProps) {
  const { callNumber } = usePhoneIslandEventHandler()
  const phoneBookModule = usePhonebookSearchModule()
  const [searchText] = phoneBookModule.searchTextState
  const [operators] = useSharedState('operators')
  const [filteredPhoneNumbers, setFilteredPhoneNumbers] = useState<SearchData[]>([])
  const [canAddToPhonebook, setCanAddToPhonebook] = useState<boolean>(false)
  const { isCallsEnabled } = useAccount()
  useEffect(() => {
    if (searchResult) preparePhoneNumbers(searchResult)
  }, [searchResult, searchText])

  const showAddContactToPhonebook = () => {
    showContactForm()
  }

  const getFoundedOperators = (): BaseAccountData[] => {
    const cleanQuery = searchText?.replace(cleanRegex, '') || ''
    let operatorsResults = Object.values(operators?.operators || {}).filter((op: any) => {
      return (
        (op.name && new RegExp(cleanQuery, 'i').test(op.name.replace(cleanRegex, ''))) ||
        new RegExp(cleanQuery, 'i').test(op.endpoints?.mainextension[0]?.id)
      )
    })

    if (operatorsResults.length) {
      operatorsResults = cloneDeep(operatorsResults)

      operatorsResults.forEach((op: any) => {
        op.resultType = 'operator'
        op.extension = op.endpoints?.mainextension[0]?.id //for phoneNumber search
      })
    }
    operatorsResults.sort(sortByProperty('name'))
    return operatorsResults
  }

  function preparePhoneNumbers(unFilteredNumbers: SearchData[]) {
    const cleanQuery = searchText?.replace(cleanRegex, '') || ''
    if (cleanQuery.length == 0) {
      return
    }

    const isPhoneNumber = getIsPhoneNumber(searchText || '')

    const keys = ['extension', 'cellphone', 'homephone', 'workphone']
    const s = (a) => {
      return keys.reduce((p, c) => {
        if (p === '') p = a[c] || ''
        return p
      }, '')
    }

    unFilteredNumbers.sort((a, b) => {
      if (isPhoneNumber) {
        const al = s(a).length
        if (al > 0) {
          if (al === searchText?.length) return -1
          const bl = s(b).length
          if (bl > 0) return al - bl
        }
        return -1
      } else {
        const as = a?.name?.toLowerCase()?.replace(cleanRegex, '')
        const bs = b?.name?.toLowerCase()?.replace(cleanRegex, '')
        return as < bs ? -1 : as > bs ? 1 : 0
      }
    })

    const filteredOperators = getFoundedOperators()
    const copy = [...filteredOperators, ...unFilteredNumbers]
    let _canAddInPhonebook = isPhoneNumber
    setFilteredPhoneNumbers(() => copy as any)
    setCanAddToPhonebook(() => _canAddInPhonebook)
  }

  const isCallButtonEnabled =
    searchText && isCallsEnabled && getIsPhoneNumber(searchText) && searchText.length > 1

  return (
    <div className="flex flex-col dark:text-titleDark text-titleLight dark:bg-bgDark bg-bgLight h-full">
      <div className="mr-[6px]">
        <div
          className={`flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 min-h-9 items-start  ${isCallButtonEnabled ? 'cursor-pointer dark:hover:bg-hoverDark hover:bg-hoverLight' : 'dark:bg-hoverDark bg-hoverLight opacity-50 cursor-not-allowed'}`}
          onClick={() => {
            if (isCallButtonEnabled && searchText) callNumber(searchText)
          }}
        >
          <FontAwesomeIcon
            className="text-base dark:text-gray-50 text-gray-600 mr-1"
            icon={CallIcon}
          />
          <p className="font-normal">
            {t('Operators.Call')} {searchText}
          </p>
        </div>

        <div className="group">
          <div
            className={`flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 w-full min-h-9  ${canAddToPhonebook ? 'cursor-pointer dark:hover:bg-hoverDark hover:bg-hoverLight' : ' dark:bg-hoverDark bg-hoverLight opacity-50 cursor-not-allowed'}`}
            onClick={() => {
              if (canAddToPhonebook) showAddContactToPhonebook()
            }}
          >
            <FontAwesomeIcon
              className="text-base dark:text-gray-50 text-gray-600"
              icon={AddUserIcon}
            />
            <p className="font-normal">
              {t('Common.Add')} {searchText?.toString()} {t('Common.to')} {t('Phonebook.Phonebook')}
            </p>
          </div>
          <div className="px-4">
            <div className="border-b dark:border-borderDark border-borderLight group-hover:border-transparent"></div>
          </div>
        </div>
      </div>
      <Scrollable>
        {
          filteredPhoneNumbers.length > 0
            ? filteredPhoneNumbers.map((user, index) => (
              <SearchNumber key={'SearchNumber_' + index} user={user} />
            ))
            : <EmptyList icon={EmptySearchIcon} text={t('Devices.No results')} />
        }
      </Scrollable>
    </div>
  )
}
