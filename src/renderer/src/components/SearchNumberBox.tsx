import { faPhone, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchNumber } from './SearchNumber'

export interface SearchNumberBoxProps {
  searchText: string
  callUser: (phoneNumber: string) => void
}

export function SearchNumberBox({ searchText, callUser }: SearchNumberBoxProps) {
  const phoneNumbers = [
    { name: 'Pippo', number: '3275757265' },
    { name: 'KZUC', number: '0613' },
    { name: "Lopre'", number: '3475757365' }
  ]

  const filteredPhoneNumbers = phoneNumbers.filter((element) => element.number.includes(searchText))

  return (
    <div className="flex flex-col">
      <div
        className="flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 min-h-9 items-start hover:bg-gray-700"
        onClick={() => alert('La funzione deve chiamare il numero.')}
      >
        <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faPhone} />
        <p>Call {searchText.toString()}</p>
      </div>

      <div
        className="flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 w-full min-h-9 hover:bg-gray-700"
        onClick={() => alert('La funzione deve aggiungere il numero.')}
      >
        <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faUserPlus} />
        <p>Add {searchText.toString()} to Phonebook</p>
      </div>
      <div className={`border-b border-gray-700 mx-4`}></div>
      <div className="px-4">
        {filteredPhoneNumbers.map((phoneNumber, index) => (
          <SearchNumber
            key={index}
            name={phoneNumber.name}
            number={phoneNumber.number}
            callUser={() => callUser(phoneNumber.number)}
            searchText={searchText}
          />
        ))}
      </div>
    </div>
  )
}
