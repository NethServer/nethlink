import {
  faMagnifyingGlass as SearchIcon,
  faXmark as DeleteSearchIcon
} from '@fortawesome/free-solid-svg-icons'
import { TextInput } from './Nethesis/TextInput'
import { t } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from './Nethesis'
import { validatePhoneNumber } from '@renderer/utils'

export interface SearchBoxProps {
  search: string
  callUser: (phoneNumber: string) => void
  handleSearch: (searchText: string) => Promise<void>
  handleReset: () => void
}

export function SearchBox({ search, callUser, handleSearch, handleReset }: SearchBoxProps): JSX.Element {
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
            if (validatePhoneNumber(search)) {
              callUser(search)
            } else {
              submit(search)
            }
          }
        }}
        className="min-w-[222px] dark:text-gray-50 text-gray-900 dark:focus:ring-2 dark:focus:ring-offset-2 dark:focus:ring-blue-200 dark:focus:ring-offset-gray-900 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white"
        /* Mi serve per dare spazio all' X Icon */
        inputClassName="pr-10"
      />
      {search === '' ? null : (
        <Button
          variant="ghost"
          className="absolute right-1 z-100 cursor-pointer mr-2 pt-[2px] pr-[2px] pb-[2px] pl-[2px] hover:bg-gray-200 dark:hover:bg-gray-600 dark:focus:ring-2 focus:ring-2 dark:focus:ring-blue-200 focus:ring-blue-500"
        >
          <FontAwesomeIcon
            icon={DeleteSearchIcon}
            className="dark:text-gray-50 text-gray-900 h-4 w-4"
            onClick={handleReset}
          />
        </Button>
      )}
    </div>
  )
}
