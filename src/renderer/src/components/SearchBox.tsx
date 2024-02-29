import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { TextInput } from './Nethesis/TextInput'

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
      icon={faSearch}
      type="text"
      value={search}
      placeholder="Call or compose..."
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
    />
  )
}
