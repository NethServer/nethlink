import { createRef, useState } from 'react'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { TextInput } from './Nethesis/TextInput'

export interface SearchBoxProps {
  handleSearch: (searchText: string) => Promise<void>
  //handleTextChange: (searchText: string) => Promise<void>
  handleReset: () => void
}

export function SearchBox({
  handleSearch,
  handleReset
  //handleTextChange
}: SearchBoxProps): JSX.Element {
  //const [showReset, setShowReset] = useState(false)

  const inputRef = createRef<HTMLInputElement>()

  /* function testReset(): void {
    setShowReset(!!inputRef.current?.value)
  } */

  function reset(): void {
    if (inputRef.current!.value === '') {
      handleReset()
      //testReset()
    }
  }

  function submit(): void {
    handleSearch(inputRef.current!.value)
  }

  return (
    <TextInput
      rounded="base"
      icon={faSearch}
      ref={inputRef}
      type="text"
      placeholder="Call or compose..."
      onChange={(e) => {
        inputRef.current!.value = e.target.value
        handleSearch(inputRef.current!.value)
        reset()
      }}
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          submit()
        }
      }}
      className="min-w-[222px] focus-visible:outline-none dark:text-gray-50 text-gray-900"
    />
  )
}
