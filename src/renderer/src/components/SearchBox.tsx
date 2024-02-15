import { createRef, useState } from 'react'
import { faSearch, faX } from '@fortawesome/free-solid-svg-icons'
import { TextInput } from '@nethesis/react-components/src/components/common'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core'

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
    <div className="relative flex flex-row items-center">
      <TextInput
        ref={inputRef}
        placeholder="Call or compose..."
        size="base"
        className="min-h-[38px] min-w-[222px]"
        icon={faSearch}
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
      />
      <FontAwesomeIcon
        className={`absolute right-2 ${showReset ? 'visible' : 'hidden'}`}
        style={{ fontSize: '16px' }}
        icon={faX}
        onClick={reset}
      />
    </div>
  )
}
