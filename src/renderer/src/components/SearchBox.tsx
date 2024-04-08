import { faSearch as SearchIcon } from '@fortawesome/free-solid-svg-icons'
import { TextInput } from './Nethesis/TextInput'
import { t } from 'i18next'

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
      className="min-w-[222px] dark:text-gray-50 text-gray-900 "
    />
  )
}
