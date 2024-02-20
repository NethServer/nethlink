import { MissedCallsBox } from '@renderer/components/MissedCallsBox'
import { Navbar } from '../components/Navbar'
import { MENU_ELEMENT, Sidebar } from '../components/Sidebar'
import { SpeedDialsBox } from '../components/SpeedDialsBox'
import { useInitialize } from '../hooks/useInitialize'
import { Account } from '@shared/types'
import { useState } from 'react'
import { SearchNumberBox } from '@renderer/components/SearchNumberBox'
import { PHONE_ISLAND_EVENTS } from '@shared/constants'

export function NethConnectorPage() {
  const [search, setSearch] = useState('')
  const [account, setAccount] = useState<Account>()
  const [selectedMenu, setSelectedMenu] = useState<MENU_ELEMENT>(MENU_ELEMENT.PHONE)
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)

  useInitialize(() => {
    initialize()
  })

  function initialize() {
    console.log('initialize')
    window.api.onAccountChange(updateAccount)
    window.api.sendInitializationCompleted('nethconnectorpage')
    window.api.addPhoneIslandListener(
      PHONE_ISLAND_EVENTS['phone-island-main-presence'],
      onMainPresence
    )
  }

  function onMainPresence(...args) {
    console.log('onMainPresence', args)
  }

  function updateAccount(e, account: Account | undefined) {
    console.log(account)
    setAccount(() => account)
  }

  async function handleSearch(searchText: string) {
    setSearch(() => searchText)
    window.api.startCall(searchText)
  }

  async function handleTextChange(searchText: string) {
    console.log(searchText)
    setSearch(() => searchText)
  }

  async function handleReset() {
    setSearch(() => '')
  }

  function openSettings() {
    alert('aprire modale')
    //window.electron.ipcRenderer.send('openWindow', 'settings')
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

  function showLogoutMenuContext(): void {
    console.log(showLogoutMenu)
    setShowLogoutMenu(!showLogoutMenu)
    //window.api.logout()
    //alert('La funzione deve mostrare il modal di Signout.')
  }

  function viewAllMissedCalls(): void {
    alert('Deve reindirizzare alla pagina per vedere tutte le chiamate perse.')
  }

  return (
    <div>
      {account && (
        <div
          className="absolute pt-[9px] container w-full h-full overflow-hidden flex flex-col justify-end items-center font-poppins text-sm text-gray-200"
          style={{ fontSize: '14px', lineHeight: '20px' }}
        >
          <div className="absolute rotate-45 origin-center w-[14px] h-[14px] bg-gray-900 top-[4px] rounded-[1px]"></div>
          <div className="flex flex-row bg-gray-900 min-w-[400px] min-h-[362px] h-full z-10 rounded-md">
            <div className="flex flex-col gap-4 pt-2 pb-4 w-full">
              <Navbar
                showLogoutMenu={showLogoutMenu}
                openSettings={openSettings}
                handleSearch={handleSearch}
                handleReset={handleReset}
                handleTextChange={handleTextChange}
                showLogoutMenuContext={showLogoutMenuContext}
              />
              {/* TODO aggiungere il controllo ed il componente delle chiamate */}
              <div className="relative w-full h-full">
                <div className="px-4 w-full h-full">
                  {selectedMenu === MENU_ELEMENT.ZAP ? (
                    <SpeedDialsBox
                      title="Speed Dials"
                      onClick={createSpeedDials}
                      callUser={callUser}
                      showNumberDetails={showNumberDetails}
                      label="Create"
                    />
                  ) : (
                    <MissedCallsBox
                      title="Missed Calls (3)"
                      label="View all"
                      onClick={viewAllMissedCalls}
                    />
                  )}
                </div>
                {search !== '' ? (
                  <div className="absolute top-0 bg-gray-900 h-full w-full">
                    <SearchNumberBox searchText={search} callUser={callUser} />
                  </div>
                ) : null}
              </div>

              {/* <button onClick={async () => window.api.logout()}>Logout</button>
              <button onClick={() => window.api.getSpeeddials()}></button>
              <div className="">{search}</div> */}
            </div>
            <Sidebar selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} />
          </div>
        </div>
      )}
    </div>
  )
}
