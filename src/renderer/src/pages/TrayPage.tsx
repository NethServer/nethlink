import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AvatarButton, MenuButton, SearchBox } from '@renderer/components'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { Account } from '@shared/types'
import { useState } from 'react'

enum MENU_ELEMENT {
  PHONE,
  EMAIL
}

export function TrayPage() {
  const [search, setSearch] = useState('')
  const [account, setAccount] = useState<Account>()

  useInitialize(() => {
    initialize()
  })

  async function initialize() {
    console.log('initialize')
    const account = await window.api.getAccount()
    setAccount(() => account)
  }

  const [selectedMenu, setSelectedMenu] = useState<MENU_ELEMENT>(MENU_ELEMENT.PHONE)

  async function handleSearch(searchText: string) {
    console.log(searchText)
    setSearch(() => searchText)
  }
  async function handleReset() {
    setSearch(() => '')
  }

  function openSettings() {
    window.electron.ipcRenderer.send('openWindow', 'settings')
  }

  return (
    <div className="absolute pb-1 container text-red-50 w-full h-full overflow-hidden flex flex-col justify-end items-center">
      {/* <Versions></Versions> */}
      <div className="bg-gray-900 w-full p-2 z-10 rounded-lg">
        <div className="flex flex-col gap-1">
          <div className="flex flex-row justify-between gap-2">
            <SearchBox handleSearch={handleSearch} handleReset={handleReset} />
            <div className="flex flex-row justify-end gap-1 items-center mr-1">
              <MenuButton
                Icon={<FontAwesomeIcon icon={'function'} />}
                invert={true}
                onClick={openSettings}
              ></MenuButton>
              <AvatarButton />
            </div>
          </div>
          <button onClick={async () => console.log(await window.api.getSpeeddials())}>
            getSpeeddials
          </button>
          <button onClick={async () => window.api.openAllSpeeddials()}>create speeddials</button>
          <button onClick={async () => window.api.openAddToPhonebook()}>add to phonebook</button>
          <button onClick={async () => console.log(await window.api.getLastCalls())}>
            get last calls
          </button>
          <button onClick={async () => window.api.openAllCalls()}>view all calls</button>
          {/* <button onClick={() => window.api.getSpeeddials()}></button> */}
          <div className="">{search}</div>
        </div>
      </div>
      {
        //todo: set della posizione in base al tray
      }
      <div className="absolute rotate-45 origin-center w-[8px] h-[8px] bg-gray-900 bottom-[2px] z-0 rounded-[1px]"></div>
    </div>
  )
}
