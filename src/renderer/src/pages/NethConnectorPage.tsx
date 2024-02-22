import { MissedCallsBox } from '@renderer/components/MissedCallsBox'
import { Navbar } from '../components/Navbar'
import { MENU_ELEMENT, Sidebar } from '../components/Sidebar'
import { SpeedDialsBox } from '../components/SpeedDialsBox'
import { useInitialize } from '../hooks/useInitialize'
import {
  Account,
  AvailableThemes,
  CallData,
  HistoryCallData,
  HistorySpeedDialType,
  SpeedDialType
} from '@shared/types'
import { useEffect, useState } from 'react'
import { SearchNumberBox } from '@renderer/components/SearchNumberBox'
import { PHONE_ISLAND_EVENTS } from '@shared/constants'
import { store } from '@shared/StoreController'
import { debouncer } from '@shared/utils/utils'

export function NethConnectorPage() {
  const [search, setSearch] = useState('')
  const [account, setAccount] = useState<Account>()
  const [selectedMenu, setSelectedMenu] = useState<MENU_ELEMENT>(MENU_ELEMENT.ZAP)
  const [speeddials, setSpeeddials] = useState<SpeedDialType[]>([])
  const [missedCalls, setMissedCalls] = useState<CallData[]>([])

  useInitialize(() => {
    initialize()
  }, true)

  useEffect(() => {
    if (search) {
      debouncer('search', () => {
        console.log('debounce')
        window.api.sendSearchText(search)
      }, 500)
    }
  }, [search])

  function initialize() {
    console.log('initialize')
    window.api.onAccountChange(updateAccount)
    window.api.addPhoneIslandListener(
      PHONE_ISLAND_EVENTS['phone-island-main-presence'],
      onMainPresence
    )
    // saveSpeeddials({
    //   count: 4,
    //   rows: [
    //     { name: 'Edoardo', speeddial_num: '3275757265' },
    //     { name: 'Pippo Bica', speeddial_num: '230' },
    //     { name: 'Giovanni', speeddial_num: '56789' },
    //     { name: 'Alexa', speeddial_num: '27589' }
    //   ]
    // })
    window.api.onReceiveSpeeddials(saveSpeeddials)
    //TODO da guardare come passare la tipologia di MissedCall, tipo commercial, customer care...
    // saveMissedCalls({
    //   count: 3,
    //   rows: [
    //     { cnam: 'Tanya Fox', cnum: '530', duration: 1, time: 14 },
    //     { cnam: 'Unknown', cnum: '333 756 0091', duration: 10, time: 12, ccompany: 'Commercial' },
    //     {
    //       cnam: 'Maple office customer service',
    //       cnum: '02 3456785',
    //       duration: 10,
    //       time: 12,
    //       ccompany: 'Customer Care'
    //     }
    //   ]
    // })
    window.api.onReceiveLastCalls(saveMissedCalls)
  }

  function onMainPresence(...args) {
    console.log('onMainPresence', args)
  }

  function updateAccount(account: Account | undefined) {
    setAccount(() => account)
  }

  async function saveSpeeddials(speeddialsResponse: SpeedDialType[] | undefined) {
    console.log(speeddialsResponse)
    setSpeeddials(() => speeddialsResponse || [])
  }

  async function saveMissedCalls(historyResponse: HistoryCallData | undefined) {
    console.log(historyResponse)
    setMissedCalls(() => historyResponse?.rows || [])
  }

  async function handleSearch(searchText: string) {
    setSearch(() => searchText)
    //callUser(searchText)
  }

  async function handleTextChange(searchText: string) {
    setSearch(() => searchText)
  }

  async function handleReset() {
    setSearch(() => '')
  }

  function callUser(phoneNumber: string): void {
    console.log(phoneNumber)
    window.api.startCall(phoneNumber)
  }

  function logout(): void {
    window.api.logout()
  }

  /* Le seguenti funzioni sono da implementare */

  function createSpeedDials(): void {
    alert('Deve reindirizzare alla pagina per creare un nuovo speed dial')
  }

  function viewAllMissedCalls(): void {
    alert('Deve reindirizzare alla pagina per vedere tutte le chiamate perse.')
  }

  function handleOnSelectTheme(theme: AvailableThemes) {
    window.api.changeTheme(theme)
    setAccount((p) => ({
      ...p!,
      theme
    }))
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
                onSelectTheme={handleOnSelectTheme}
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
