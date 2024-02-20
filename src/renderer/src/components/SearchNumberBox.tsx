import { faPhone, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SearchNumber } from './SearchNumber'

export interface SearchNumberBoxProps {
  searchText: string
  callUser: (phoneNumber: string) => void
}

//TODO aggiungere le funzioni per i due div di aggiungere e chiamare il numero, inoltre guardare l'effeto hover

export function SearchNumberBox({ searchText, callUser }: SearchNumberBoxProps) {
  return (
    <div className="flex flex-col">
      <div
        className="flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 min-h-9 items-start"
        onClick={() => alert('La funzione deve chiamare il numero.')}
      >
        <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faPhone} />
        <p>Call {searchText.toString()}</p>
      </div>

      <div
        className="flex gap-5 pt-[10px] pr-8 pb-[10px] pl-7 w-full min-h-9"
        onClick={() => alert('La funzione deve aggiungere il numero.')}
      >
        <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faUserPlus} />
        <p>Add {searchText.toString()} to Phonebook</p>
      </div>

      <div className="px-4">
        <SearchNumber name="Pippo" number="3275757265" callUser={() => callUser('3275757265')} />
        <SearchNumber name="KZUC" number="0613" callUser={() => callUser('0613')} />
        <SearchNumber name="Lopre'" number="3475757365" callUser={() => callUser('3475757365')} />
      </div>
    </div>
  )
}
