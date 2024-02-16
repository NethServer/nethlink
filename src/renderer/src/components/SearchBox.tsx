import { createRef, useState } from 'react'
import { TextInput } from '@nethesis/react-components/src/components/common'

export interface SearchBoxProps {
  handleSearch: (searchText: string) => Promise<void>
  handleReset: () => void
}

export function SearchBox({ handleSearch, handleReset }: SearchBoxProps): JSX.Element {
  const [showReset, setShowReset] = useState(false)

  const inputRef = createRef<HTMLInputElement>()

  function testReset(): void {
    setShowReset(!!inputRef.current?.value)
  }

  function reset(): void {
    inputRef.current!.value = ''
    handleReset()
    testReset()
  }

  function submit(): void {
    handleSearch(inputRef.current!.value)
  }

  return (
    //TODO guardare come modificare il colore
    <TextInput
      rounded="base"
      //icon={faSearch}
      ref={inputRef}
      type="text"
      placeholder="Call or compose..."
      onChange={(e) => {
        inputRef.current!.value = e.target.value
        testReset()
      }}
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          submit()
        }
      }}
      className="min-w-[222px] focus-visible:outline-none"
    />
  )
}
