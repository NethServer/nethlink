import { faPhone, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchNumber } from './SearchNumber'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { useState } from 'react'
import { SearchCallData, SearchData } from '@shared/types'
import { AddToPhonebookBox } from './AddToPhonebookBox'

export interface SearchNumberBoxProps {
  searchText: string
  callUser: (phoneNumber: string) => void
  handleReset: () => void
  setIsContactSaved: (boolean) => void
}

export function SearchNumberBox({
  searchText,
  callUser,
  handleReset,
  setIsContactSaved
}: SearchNumberBoxProps) {
  const [filteredPhoneNumbers, setFilteredPhoneNumbers] = useState<SearchData[]>([])
  const [isAddingToPhonebook, setIsAddingToPhonebook] = useState<boolean>(false)

  useInitialize(() => {
    window.api.onSearchResult(preparePhoneNumbers)
  })

  function preparePhoneNumbers(receivedPhoneNumbers: SearchCallData) {
    setFilteredPhoneNumbers(() => receivedPhoneNumbers.rows)
  }

  return (
    <>
      {isAddingToPhonebook ? (
        <AddToPhonebookBox
          setIsAddingToPhonebook={setIsAddingToPhonebook}
          setIsContactSaved={setIsContactSaved}
          handleReset={handleReset}
        />
      ) : (
        <div className="flex flex-col">
          <div
            className="flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 min-h-9 items-start hover:bg-gray-700 cursor-pointer"
            onClick={() => callUser(searchText)}
          >
            <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faPhone} />
            <p>Call {searchText}</p>
          </div>

          <div
            className="flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 w-full min-h-9 hover:bg-gray-700 cursor-pointer"
            onClick={() => setIsAddingToPhonebook(true)}
          >
            <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faUserPlus} />
            <p>Add {searchText.toString()} to Phonebook</p>
          </div>
          <div className={`border-b border-gray-700 mx-4`}></div>
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
      )}
    </>
  )
}
