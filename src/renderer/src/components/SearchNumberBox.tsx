import { faPhone as CallIcon, faUserPlus as AddUserIcon } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchNumber } from './SearchNumber'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { useEffect, useState } from 'react'
import { OperatorsType, SearchCallData, SearchData } from '@shared/types'
import { t } from 'i18next'
import { log } from '@shared/utils/logger'
import { sortByProperty } from '@renderer/lib/utils'
import { useSubscriber } from '@renderer/hooks/useSubscriber'
import { cloneDeep } from 'lodash'

export interface SearchNumberBoxProps {
  searchText: string
  callUser: (phoneNumber: string) => void
  showAddContactToPhonebook: () => void
}

export function SearchNumberBox({
  searchText,
  callUser,
  showAddContactToPhonebook
}: SearchNumberBoxProps) {
  const [filteredPhoneNumbers, setFilteredPhoneNumbers] = useState<SearchData[]>([])
  const [unFilteredPhoneNumbers, setUnFilteredPhoneNumbers] = useState<SearchData[]>([])

  useInitialize(() => {
    window.api.onSearchResult(saveUnfiltered)
  })

  function saveUnfiltered(receivedPhoneNumbers: SearchCallData) {
    console.log('Receveid numbers: ', receivedPhoneNumbers)
    const filteredNumbers = receivedPhoneNumbers.rows.filter(
      (phoneNumber) => !(!phoneNumber.name || phoneNumber.name === '')
    )
    setUnFilteredPhoneNumbers(() => filteredNumbers)
  }

  useEffect(() => {
    preparePhoneNumbers(unFilteredPhoneNumbers)
  }, [unFilteredPhoneNumbers])

  function preparePhoneNumbers(unFilteredNumbers: SearchData[]) {
    const cleanRegex = /[^a-zA-Z0-9]/g
    const cleanQuery = searchText.replace(cleanRegex, '')
    if (cleanQuery.length == 0) {
      return
    }

    let isPhoneNumber = false
    if (/^\+?[0-9|\s]+$/.test(cleanQuery)) {
      // show "Call phone number" result
      isPhoneNumber = true
    }

    const keys = ['extension', 'cellphone', 'homephone', 'workphone']
    const s = (a) => {
      return keys.reduce((p, c) => {
        if (p === '') p = a[c] || ''
        return p
      }, '')
    }
    const copy = [...unFilteredNumbers]
    unFilteredNumbers.sort((a, b) => {
      log({ isPhoneNumber, aname: a.name, anum: s(a), bname: b.name, bnum: s(b) })
      if (isPhoneNumber) {
        const al = s(a).length
        if (al > 0) {
          if (al === searchText.length) return -1
          const bl = s(b).length
          if (bl > 0) return al - bl
        }
        return -1
      } else {
        const as = a.name.toLowerCase().replace(cleanRegex, '')
        const bs = b.name.toLowerCase().replace(cleanRegex, '')
        return as < bs ? -1 : as > bs ? 1 : 0
      }
    })
    log(copy, unFilteredNumbers)

    setFilteredPhoneNumbers(() => unFilteredNumbers)
  }

  return (
    <div className="flex flex-col dark:text-gray-50 text-gray-900 dark:bg-gray-900 bg-gray-50">
      <div
        className="flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 min-h-9 items-start dark:hover:bg-gray-600 hover:bg-gray-200 cursor-pointer"
        onClick={() => callUser(searchText)}
      >
        <FontAwesomeIcon
          className="text-base dark:text-gray-50 text-gray-600 mr-1"
          icon={CallIcon}
        />
        <p className="font-normal">
          {t('Operators.Call')} {searchText}
        </p>
      </div>

      <div
        className="flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 w-full min-h-9 dark:hover:bg-gray-600 hover:bg-gray-200 cursor-pointer"
        onClick={showAddContactToPhonebook}
      >
        <FontAwesomeIcon className="text-base dark:text-gray-50 text-gray-600" icon={AddUserIcon} />
        <p className="font-normal">
          {t('Common.Add')} {searchText.toString()} {t('Common.to')} {t('Phonebook.Phonebook')}
        </p>
      </div>
      <div className={`border-b dark:border-gray-700 border-gray-200`}></div>
      <div className="overflow-y-auto max-h-[178px]">
        {filteredPhoneNumbers.map((user, index) => (
          <SearchNumber
            key={index}
            user={user}
            callUser={callUser}
            searchText={searchText}
            className="dark:hover:bg-gray-600 hover:bg-gray-200"
          />
        ))}
      </div>
    </div>
  )
}
