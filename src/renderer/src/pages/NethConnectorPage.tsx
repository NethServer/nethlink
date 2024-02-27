import { MissedCallsBox } from '@renderer/components/MissedCallsBox'
import { Navbar } from '../components/Navbar'
import { MENU_ELEMENT, Sidebar } from '../components/Sidebar'
import { SpeedDialsBox } from '../components/SpeedDialsBox'
import { useInitialize } from '../hooks/useInitialize'
import { Account, AvailableThemes, CallData, HistoryCallData, SpeedDialType } from '@shared/types'
import { useEffect, useState } from 'react'
import { SearchNumberBox } from '@renderer/components/SearchNumberBox'
import { PHONE_ISLAND_EVENTS } from '@shared/constants'
import { debouncer } from '@shared/utils/utils'
import { useLocalStoreState } from '@renderer/hooks/useLocalStoreState'

export function NethConnectorPage() {
  const [search, setSearch] = useState('')
  const [account, setAccount] = useState<Account>()
  const [selectedMenu, setSelectedMenu] = useState<MENU_ELEMENT>(MENU_ELEMENT.ZAP)
  const [speeddials, setSpeeddials] = useState<SpeedDialType[]>([])
  const [missedCalls, setMissedCalls] = useState<CallData[]>([])
  const [_, setOperators] = useLocalStoreState('operators')
  const [isContactSaved, setIsContactSaved] = useState<boolean>(false)
  const [isAddingToPhonebook, setIsAddingToPhonebook] = useState<boolean>(false)
  useInitialize(() => {
    initialize()
  }, true)

  useEffect(() => {
    if (search) {
      debouncer(
        'search',
        () => {
          console.log('debounce')
          window.api.sendSearchText(search)
        },
        250
      )
    }
  }, [search])

  function initialize() {
    console.log('initialize')
    window.api.onAccountChange(updateAccount)
    window.api.addPhoneIslandListener(
      PHONE_ISLAND_EVENTS['phone-island-main-presence'],
      onMainPresence
    )
    window.api.onReceiveSpeeddials(saveSpeeddials)
    window.api.onReceiveLastCalls(saveMissedCalls)
  }

  function onMainPresence(op: any) {
    Object.entries(op).forEach(([k, v]) => {
      setOperators((o) => ({
        ...o,
        [k]: v
      }))
    })
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
          className="absolute container w-full h-full overflow-hidden flex flex-col justify-end items-center font-poppins text-sm dark:text-gray-200 text-gray-900"
          style={{ fontSize: '14px', lineHeight: '20px' }}
        >
          <div className="flex flex-row dark:bg-gray-900 bg-gray-50 min-w-[400px] min-h-[362px] h-full z-10 rounded-md">
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
                      callUser={callUser}
                      label="Create"
                      isContactSaved={isContactSaved}
                    />
                  ) : (
                    <MissedCallsBox
                      missedCalls={missedCalls}
                      title={`Missed Calls (${missedCalls.length})`}
                      label="View all"
                      onClick={viewAllMissedCalls}
                      isContactSaved={isContactSaved}
                    />
                  )}
                </div>
                {search !== '' ? (
                  <div className="absolute top-0 dark:bg-gray-900 bg-gray-50 h-full w-full">
                    <SearchNumberBox
                      isAddingToPhonebook={isAddingToPhonebook}
                      setIsAddingToPhonebook={setIsAddingToPhonebook}
                      searchText={search}
                      callUser={callUser}
                      handleReset={handleReset}
                      setIsContactSaved={setIsContactSaved}
                    />
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
