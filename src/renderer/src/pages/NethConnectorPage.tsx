import { MissedCallsBox } from '@renderer/components/MissedCallsBox'
import { Navbar } from '../components/Navbar'
import { MENU_ELEMENT, Sidebar } from '../components/Sidebar'
import { SpeedDialsBox } from '../components/SpeedDialsBox'
import { useInitialize } from '../hooks/useInitialize'
import {
  Account,
  CallData,
  HistoryCallData,
  HistorySpeedDialType,
  SpeedDialType
} from '@shared/types'
import { useState } from 'react'
import { SearchNumberBox } from '@renderer/components/SearchNumberBox'
import { PHONE_ISLAND_EVENTS } from '@shared/constants'
import { store } from '@shared/StoreController'

export function NethConnectorPage() {
  const [search, setSearch] = useState('')
  const [account, setAccount] = useState<Account>()
  const [selectedMenu, setSelectedMenu] = useState<MENU_ELEMENT>(MENU_ELEMENT.ZAP)
  const [speeddials, setSpeeddials] = useState<SpeedDialType[]>([])
  const [missedCalls, setMissedCalls] = useState<CallData[]>([])

  useInitialize(() => {
    initialize()
  }, true)

  function initialize() {
    console.log('initialize')
    window.api.onAccountChange(updateAccount)
    window.api.addPhoneIslandListener(
      PHONE_ISLAND_EVENTS['phone-island-main-presence'],
      onMainPresence
    )
    saveSpeeddials({
      count: 4,
      rows: [
        { name: 'Edoardo', speeddial_num: '3275757265' },
        { name: 'Pippo Bica', speeddial_num: '230' },
        { name: 'Giovanni', speeddial_num: '56789' },
        { name: 'Alexa', speeddial_num: '27589' }
      ]
    })
    window.api.onReceiveSpeeddials(saveSpeeddials)
    //TODO da guardare come passare la tipologia di MissedCall, tipo commercial, customer care...
    saveMissedCalls({
      count: 3,
      rows: [
        { cnam: 'Tanya Fox', cnum: '530', duration: 1, time: 14 },
        { cnam: 'Unknown', cnum: '333 756 0091', duration: 10, time: 12, ccompany: 'Commercial' },
        {
          cnam: 'Maple office customer service',
          cnum: '02 3456785',
          duration: 10,
          time: 12,
          ccompany: 'Customer Care'
        }
      ]
    })
    window.api.onReciveLastCalls(saveMissedCalls)
  }

  function onMainPresence(...args) {
    console.log('onMainPresence', args)
  }

  function updateAccount(e, account: Account | undefined) {
    setAccount(() => account)
  }

  async function saveSpeeddials(speeddialsResponse: HistorySpeedDialType) {
    setSpeeddials(() => speeddialsResponse.rows)
  }

  async function saveMissedCalls(historyResponse: HistoryCallData) {
    setMissedCalls(() => historyResponse.rows)
  }

  async function handleSearch(searchText: string) {
    setSearch(() => searchText)
    callUser(searchText)
  }

  async function handleTextChange(searchText: string) {
    setSearch(() => searchText)
  }

  async function handleReset() {
    setSearch(() => '')
  }

  function callUser(phoneNumber: string): void {
    window.api.startCall(phoneNumber)
    console.log('name: ' + account?.data?.name)
    console.log('username: ' + account?.username)
    console.log('mainPresece: ' + account?.data?.mainPresece)
    console.log('presence: ' + account?.data?.presence)
    console.log('presenceOnBusy: ' + account?.data?.presenceOnBusy)
    console.log('presenceOnUnavailable: ' + account?.data?.presenceOnUnavailable)
    console.log('recallOnBusy: ' + account?.data?.recallOnBusy)
    console.log('Theme: ' + account?.theme)
  }

  function logout(): void {
    window.api.logout()
  }

  /* Le seguenti funzioni sono da implementare */

  function createSpeedDials(): void {
    alert('Deve reindirizzare alla pagina per creare un nuovo speed dial')
  }

  function showNumberDetails(e: any): void {
    alert(`La funzione dovrebbe mostrare i dettagli dell'utente selezionato. ${e}`)
  }

  function viewAllMissedCalls(): void {
    alert('Deve reindirizzare alla pagina per vedere tutte le chiamate perse.')
  }

  return (
    <div>
      {account && (
        <div
          className="absolute container w-full h-full overflow-hidden flex flex-col justify-end items-center font-poppins text-sm text-gray-200"
          style={{ fontSize: '14px', lineHeight: '20px' }}
        >
          <div className="flex flex-row bg-gray-900 min-w-[400px] min-h-[362px] h-full z-10 rounded-md">
            <div className="flex flex-col gap-4 pt-2 pb-4 w-full">
              <Navbar
                account={account}
                setAccount={setAccount}
                logout={logout}
                handleSearch={handleSearch}
                handleReset={handleReset}
                handleTextChange={handleTextChange}
              />
              <div className="relative w-full h-full">
                <div className="px-4 w-full h-full">
                  {selectedMenu === MENU_ELEMENT.ZAP ? (
                    <SpeedDialsBox
                      speeddials={speeddials}
                      title="Speed Dials"
                      onClick={createSpeedDials}
                      callUser={callUser}
                      showNumberDetails={showNumberDetails}
                      label="Create"
                    />
                  ) : (
                    <MissedCallsBox
                      missedCalls={missedCalls}
                      title={`Missed Calls (${missedCalls.length})`}
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
            </div>
            <Sidebar selectedMenu={selectedMenu} setSelectedMenu={setSelectedMenu} />
          </div>
        </div>
      )}
    </div>
  )
}
