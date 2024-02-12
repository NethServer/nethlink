import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MenuButton } from './MenuButton'
import { createRef, useState } from 'react'

export type SearchBoxProps = {
  handleSearch: (searchText: string) => Promise<void>
  handleReset: () => void
}

export function SearchBox({ handleSearch, handleReset }: SearchBoxProps) {
  const [showReset, setShowReset] = useState(false)

  const inputRef = createRef<HTMLInputElement>()

  function testReset() {
    setShowReset(!!inputRef.current?.value)
  }

  function reset() {
    inputRef.current!.value = ''
    handleReset()
    testReset()
  }

  function submit() {
    handleSearch(inputRef.current!.value)
  }

  return (
    <div className="flex flex-row items-center relative">
      <MenuButton
        Icon={<FontAwesomeIcon icon="folder-magnifying-glass" />}
        invert
        onClick={submit}
      />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search"
        className={`text-white bg-transparent focus-visible:outline-none w-full mr-8`}
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
      <MenuButton
        Icon={<FontAwesomeIcon icon="fax" />}
        className={`absolute right-[0] ${showReset ? 'visible' : 'hidden'}`}
        invert
        onClick={reset}
      />
    </div>
  )
}
