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
  NewContactType,
  ContactType
} from '@shared/types'
import { useEffect, useState } from 'react'
import { SearchNumberBox } from '@renderer/components/SearchNumberBox'
import { PHONE_ISLAND_EVENTS } from '@shared/constants'
import { debouncer } from '@shared/utils/utils'
import { AddToPhonebookBox } from '@renderer/components/AddToPhonebookBox'
import { CreateSpeedDialBox } from '@renderer/components/CreateSpeedDialBox'
import { useLocalStoreState } from '@renderer/hooks/useLocalStoreState'

export function NethLinkPage() {
  const [search, setSearch] = useState('')
  const [account, setAccount] = useLocalStoreState<Account>('user')
  const [selectedMenu, setSelectedMenu] = useState<MENU_ELEMENT>(MENU_ELEMENT.SPEEDDIALS)
  const [speeddials, setSpeeddials] = useState<ContactType[]>([])
  const [missedCalls, setMissedCalls] = useState<CallData[]>([])
  const [_, setOperators] = useLocalStoreState('operators')
  const [isCreatingSpeedDial, setIsCreatingSpeedDial] = useState<boolean>(false)
  const [selectedMissedCall, setSelectedMissedCall] = useState<{
    number?: string
    company?: string
  } | null>(null)

  useInitialize(() => {
    initialize()
  }, true)

  //Potrebbe non servire
  const [theme, setTheme] = useState<AvailableThemes | undefined>('dark')

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

  /* Problema con il tema del sistema se cambio il tema del sistema non viene effettutato  */

  useEffect(() => {
    if (account) {
      if (account.theme === 'system') {
        setTheme(() => {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        })
      } else {
        setTheme(() => account.theme)
      }
    }
  }, [account])

  function initialize() {
    console.log('initialize')
    window.api.onAccountChange(updateAccount)
    window.api.addPhoneIslandListener(
      PHONE_ISLAND_EVENTS['phone-island-main-presence'],
      onMainPresence
    )
    window.api.onReceiveSpeeddials(saveSpeeddials)
    window.api.onReceiveLastCalls(saveMissedCalls)
    window.api.onSystemThemeChange((theme) => {
      updateTheme(theme)
    })
  }

  const updateTheme = (theme: AvailableThemes) => {
    console.log(account)
    if (account.theme === 'system') {
      setTheme(() => theme)
    }
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

  async function saveSpeeddials(speeddialsResponse: ContactType[] | undefined) {
    console.log(speeddialsResponse)
    setSpeeddials(() => speeddialsResponse || [])
  }

  async function saveMissedCalls(historyResponse: HistoryCallData | undefined) {
    console.log(historyResponse)
    setMissedCalls(() => historyResponse?.rows || [])
  }

  async function handleSearch(searchText: string) {
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

  //FUNZIONE PER IL CASO IN CUI SI AGGIUNGE UN NUOVO CONTATTO DA CREATE IN MISSEDCALL
  function handleSelectedMissedCall(number: string, company: string | undefined) {
    if (company === undefined) {
      setSelectedMissedCall(() => ({ number, company: '' }))
    } else setSelectedMissedCall(() => ({ number, company }))
    console.log('SELECTED MISSED CALL', selectedMissedCall)
  }

  async function handleAddContactToPhonebook(contact: NewContactType) {
    // da aggiungere funzionalita' api per salvare il nuovo contatto
    const [_, err] = await window.api.addContactToPhonebook(contact)
    if (!!err) throw err
    setSearch(() => '')
    setSelectedMissedCall(() => null)
  }

  async function handleAddContactToSpeedDials(contact: NewContactType) {
    // da aggiungere funzionalita' api per salvare il nuovo speedDial
    const [_, err] = await window.api.addContactSpeedDials(contact)
    if (!!err) throw err
    setIsCreatingSpeedDial(() => false)
    setSearch(() => '')
  }

  function handleSidebarMenuSelection(menuElement: MENU_ELEMENT): void {
    setSelectedMenu(() => menuElement)
    //Aggiunto il fatto che se seleziono un menu faccio il reset della
    //SearchBox e dello stato di aggiunta di un numero su Phonebook
    setSearch(() => '')
    setSelectedMissedCall(() => null)
  }

  function handleOnSelectTheme(theme: AvailableThemes) {
    window.api.changeTheme(theme)
    setAccount((p) => ({
      ...p!,
      theme
    }))
  }

  function viewAllMissedCalls(): void {
    window.api.openMissedCallsPage('https://cti.demo-heron.sf.nethserver.net/history')
  }

  function goToNethVoicePage(): void {
    window.api.openNethVoicePage('https://cti.demo-heron.sf.nethserver.net')
  }

  function handleModifySpeedDial(): void {
    //Da aggiungere window.api
    alert('Modifica il numero.')
  }

  function handleDeleteSpeedDial(): void {
    //Da aggiungere window.api
    alert('Elimina')
  }

  return (
    <div className="h-[100vh] w-[100vw] rounded-[10px] overflow-hidden">
      {account && (
        <div className={theme}>
          <div className="absolute container w-full h-full overflow-hidden flex flex-col justify-end items-center font-poppins text-sm dark:text-gray-200 text-gray-900">
            <div className="flex flex-row dark:bg-gray-900 bg-gray-50 min-w-[400px] min-h-[362px] h-full z-10 rounded-md">
              <div className="flex flex-col gap-4 pt-2 pb-4 w-full">
                <Navbar
                  search={search}
                  account={account}
                  onSelectTheme={handleOnSelectTheme}
                  logout={logout}
                  handleSearch={handleSearch}
                  handleReset={handleReset}
                  goToNethVoicePage={goToNethVoicePage}
                />
                <div className="relative w-full h-full">
                  <div className="px-4 w-full h-full z-1">
                    {selectedMenu === MENU_ELEMENT.SPEEDDIALS ? (
                      isCreatingSpeedDial ? (
                        <CreateSpeedDialBox
                          handleAddContactToSpeedDials={handleAddContactToSpeedDials}
                          onCancel={() => setIsCreatingSpeedDial(false)}
                        />
                      ) : (
                        <SpeedDialsBox
                          speeddials={speeddials}
                          callUser={callUser}
                          label="Create"
                          showCreateSpeedDial={() => setIsCreatingSpeedDial(true)}
                          handleModifySpeedDial={handleModifySpeedDial}
                          handleDeleteSpeedDial={handleDeleteSpeedDial}
                        />
                      )
                    ) : (
                      <MissedCallsBox
                        missedCalls={missedCalls}
                        title={`Missed Calls (${missedCalls.length})`}
                        label="View all"
                        viewAllMissedCalls={viewAllMissedCalls}
                        handleSelectedMissedCall={handleSelectedMissedCall}
                      />
                    )}
                  </div>
                  {search !== '' && !selectedMissedCall ? (
                    <div className="absolute top-0 z-[100] dark:bg-gray-900 bg-gray-50 h-full w-full">
                      <SearchNumberBox
                        searchText={search}
                        showAddContactToPhonebook={() => setSelectedMissedCall(() => ({}))}
                        callUser={callUser}
                      />
                    </div>
                  ) : null}
                  {selectedMissedCall ? (
                    <div className="absolute top-0 z-[100] dark:bg-gray-900 bg-gray-50 h-full w-full">
                      <AddToPhonebookBox
                        searchText={search}
                        selectedNumber={
                          selectedMissedCall.number === null ? '' : selectedMissedCall.number
                        }
                        selectedCompany={
                          selectedMissedCall.company === null ? '' : selectedMissedCall.company
                        }
                        handleAddContactToPhonebook={handleAddContactToPhonebook}
                        onCancel={() => {
                          setSelectedMissedCall(() => null)
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
              <Sidebar
                selectedMenu={selectedMenu}
                handleSidebarMenuSelection={handleSidebarMenuSelection}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
