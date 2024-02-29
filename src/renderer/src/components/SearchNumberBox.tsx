import { faPhone, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchNumber } from './SearchNumber'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { useState } from 'react'
import { SearchCallData, SearchData } from '@shared/types'

export interface SearchNumberBoxProps {
  searchText: string
  callUser: (phoneNumber: string) => void
  handleAddContactToPhonebook: (boolean) => void
}

export function SearchNumberBox({
  searchText,
  callUser,
  handleAddContactToPhonebook
}: SearchNumberBoxProps) {
  const [filteredPhoneNumbers, setFilteredPhoneNumbers] = useState<SearchData[]>([])

  useInitialize(() => {
    window.api.onSearchResult(preparePhoneNumbers)
  })

  function preparePhoneNumbers(receivedPhoneNumbers: SearchCallData) {
    setFilteredPhoneNumbers(() => receivedPhoneNumbers.rows)
  }

  return (
    <div className="flex flex-col dark:text-gray-50 text-gray-900 dark:bg-gray-900 bg-gray-50">
      <div
        className="flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 min-h-9 items-start dark:hover:bg-gray-700 hover:bg-gray-200 cursor-pointer"
        onClick={() => callUser(searchText)}
      >
        <FontAwesomeIcon className="text-base dark:text-gray-50 text-gray-600" icon={faPhone} />
        <p className="font-semibold">Call {searchText}</p>
      </div>

      <div
        className="flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 w-full min-h-9 dark:hover:bg-gray-700 hover:bg-gray-200 cursor-pointer"
        onClick={() => handleAddContactToPhonebook(true)}
      >
        <FontAwesomeIcon className="text-base dark:text-gray-50 text-gray-600" icon={faUserPlus} />
        <p className="font-semibold">Add {searchText.toString()} to Phonebook</p>
      </div>
      <div className={`border-b dark:border-gray-700 border-gray-200 mx-4`}></div>
      <div className="px-4 overflow-y-auto max-h-[216px]">
        {filteredPhoneNumbers.map((phoneNumber, index) => (
          <SearchNumber
            key={index}
            name={phoneNumber.name}
            number={phoneNumber.workphone}
            callUser={() => callUser(phoneNumber.workphone)}
            searchText={searchText}
          />
        ))}
      </div>
    </div>
  )
}
