import { useRef, useState } from 'react'
import { SpeedDialsBox } from '../components/SpeedDialsBox'
import { MENU_ELEMENT, Sidebar } from '../components/Sidebar'
import { Navbar } from '../components/Navbar'

export function TrayPage(): JSX.Element {
  const hasInitialized = useRef(false)

  const [search, setSearch] = useState('')
  const [selectedMenu, setSelectedMenu] = useState<MENU_ELEMENT>(MENU_ELEMENT.ZAP)

  async function handleSearch(searchText: string): Promise<void> {
    console.log(searchText)
    setSearch(() => searchText)
    window.api.startCall(searchText)
  }
  async function handleReset(): Promise<void> {
    setSearch(() => '')
  }

  function openSettings(): void {
    alert('Deve aprire le settings.')
    window.electron.ipcRenderer.send('openWindow', 'settings')
  }

  function createSpeedDials(): void {
    alert('Deve reindirizzare alla pagina per creare un nuovo speed dial')
  }

  function callUser(phoneNumber: string): void {
    //window.api.startCall(phoneNumber)
    alert(`Deve chiamare l'utente selezionato. ${phoneNumber}`)
  }

  function showNumberDetails(e: any): void {
    alert(`La funzione dovrebbe mostrare i dettagli dell' utente selezionato. ${e}`)
  }

  function showSignOutModal(): void {
    //window.api.logout()
    alert('La funzione deve mostrare il modal di Signout.')
  }

  return (
    <div
      className="absolute pt-[9px] container w-full h-full  flex flex-col justify-end items-center text-sm text-gray-200"
      style={{ fontSize: '14px', lineHeight: '20px' }}
    >
      <div className="absolute rotate-45 origin-center w-[14px] h-[14px] bg-gray-900 top-[4px] rounded-[1px]"></div>
      <div className="flex flex-row bg-gray-900 w-full h-full rounded-md">
        <div className="flex flex-col justify-between gap-4 pt-2 pr-4 pb-4 pl-4 min-w-[350px]">
          <Navbar
            openSettings={openSettings}
            handleSearch={handleSearch}
            handleReset={handleReset}
            showSignOutModal={showSignOutModal}
          />
          <SpeedDialsBox
            title="Speed Dials"
            onClick={createSpeedDials}
            callUser={callUser}
            showNumberDetails={showNumberDetails}
            label="Create"
          />
          <button onClick={async () => console.log()}>
            getSpeeddials
          </button>
          <button onClick={async () => window.api.openAllSpeeddials()}>create speeddials</button>
          <button onClick={async () => window.api.openAddToPhonebook()}>add to phonebook</button>
          <button onClick={async () => console.log(await window.api.getLastCalls())}>
            get last calls
          </button>
          <button onClick={async () => window.api.openAllCalls()}>view all calls</button>
          <button onClick={async () => window.api.logout()}>Logout</button>
          {/* <button onClick={() => window.api.getSpeeddials()}></button> */}
          <div className="">{search}</div>
        </div>
        <Sidebar selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} />
      </div>
    </div>
  )
}
