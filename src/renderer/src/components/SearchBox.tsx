import {
  faSearch as SearchIcon,
  faXmark as DeleteSearchIcon
} from '@fortawesome/free-solid-svg-icons'
import { TextInput } from './Nethesis/TextInput'
import { t } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export interface SearchBoxProps {
  search: string
  handleSearch: (searchText: string) => Promise<void>
  handleReset: () => void
}

export function SearchBox({ search, handleSearch, handleReset }: SearchBoxProps): JSX.Element {
  function reset(searchText: string): void {
    if (searchText === '') {
      handleReset()
    }
  }

  function submit(searchText: string): void {
    handleSearch(searchText)
  }

  return (
    <div className="flex flex-row items-center relative">
      <TextInput
        rounded="base"
        icon={SearchIcon}
        type="text"
        value={search}
        placeholder={t('Common.Call or compose') as string}
        onChange={(e) => {
          handleSearch(e.target.value)
          reset(e.target.value)
        }}
        onSubmit={() => submit(search)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            submit(search)
          }
        }}
        className="min-w-[222px] focus-visible:outline-none dark:text-gray-50 text-gray-900"
        /* Mi serve per dare spazio all' X Icon */
        inputClassName="pr-10"
      />
      {search === '' ? null : (
        <FontAwesomeIcon
          icon={DeleteSearchIcon}
          className="absolute right-1 dark:text-gray-50 text-gray-900 z-10 pr-3 h-4 w-4 cursor-pointer"
          onClick={handleReset}
        />
      )}
    </div>
  )
}
