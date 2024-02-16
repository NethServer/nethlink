import { createRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faX } from '@fortawesome/free-solid-svg-icons'
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

{
  /* <div className="flex flex-row gap-2 items-center px-2 py-[9px] min-w-[222px]">
      <FontAwesomeIcon style={{ fontSize: '16px' }} icon={faSearch} onClick={submit} />
      <input
        ref={inputRef}
        type="text"
        placeholder="Call or compose..."
        className={`text-gray-50 bg-transparent focus-visible:outline-none w-full font-normal placeholder:text-gray-50`}
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
      ></input>
      <FontAwesomeIcon
        className={`absolute right-[0] ${showReset ? 'visible' : 'hidden'}`}
        style={{ fontSize: '16px' }}
        icon={faX}
        onClick={reset}
      />
    </div> */
}
