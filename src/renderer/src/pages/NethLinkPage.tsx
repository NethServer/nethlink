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
  ContactType,
  NewSpeedDialType,
  OperatorData
} from '@shared/types'
import { useEffect, useState } from 'react'
import { SearchNumberBox } from '@renderer/components/SearchNumberBox'
import { PHONE_ISLAND_EVENTS } from '@shared/constants'
import { debouncer } from '@shared/utils/utils'
import { AddToPhonebookBox } from '@renderer/components/AddToPhonebookBox'
import { CreateSpeedDialBox } from '@renderer/components/CreateSpeedDialBox'
import { useLocalStoreState } from '@renderer/hooks/useLocalStoreState'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { log } from '@shared/utils/logger'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { t } from 'i18next'
import { EditSpeedDialBox } from '@renderer/components/EditSpeedDialBox'

export function NethLinkPage() {
  const [search, setSearch] = useState('')
  const [account, setAccount] = useLocalStoreState<Account>('user')
  const [selectedMenu, setSelectedMenu] = useState<MENU_ELEMENT>(MENU_ELEMENT.SPEEDDIALS)
  const [speeddials, setSpeeddials] = useState<ContactType[]>([])
  const [missedCalls, setMissedCalls] = useState<CallData[]>([])
  const [operators, setOperators] = useLocalStoreState<OperatorData>('operators')
  const [isCreatingSpeedDial, setIsCreatingSpeedDial] = useState<boolean>(false)
  const [selectedMissedCall, setSelectedMissedCall] = useState<{
    number?: string
    company?: string
  } | null>(null)
  const [isEditingSpeedDial, setIsEditingSpeedDial] = useState<boolean>(false)
  const [selectedSpeedDial, setSelectedSpeedDial] = useState<{
    id?: string
    name?: string
    speeddial_num?: string
  } | null>(null)

  useInitialize(() => {
    initialize()
  }, true)

  //Potrebbe non servire
  const [theme, setTheme] = useState<AvailableThemes | undefined>(undefined)

  useEffect(() => {
    if (search) {
      debouncer(
        'search',
        () => {
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
    window.api.onAccountChange(updateAccount)
    window.api.addPhoneIslandListener(
      PHONE_ISLAND_EVENTS['phone-island-main-presence'],
      onMainPresence
    )
    window.api.onReceiveSpeeddials(saveSpeeddials)
    window.api.onReceiveLastCalls(saveMissedCalls)
    window.api.onOperatorsChange(updateOperators)
    window.api.onSystemThemeChange((theme) => {
      updateTheme(theme)
    })
  }

  const updateTheme = (theme: AvailableThemes) => {
    log('FROM WINDOW', theme)
    if (account!.theme === 'system') {
      setTheme(() => theme)
    }
  }

  function onMainPresence(op: any) {
    //TODO: edit
    log(operators, op)

  }

  function updateAccount(account: Account | undefined) {
    setAccount(() => account)
  }

  async function saveSpeeddials(speeddialsResponse: ContactType[] | undefined) {
    setSpeeddials(() => speeddialsResponse || [])
  }

  async function saveMissedCalls(historyResponse: HistoryCallData | undefined) {
    setMissedCalls(() => historyResponse?.rows || [])
  }

  function updateOperators(updateOperators: OperatorData | undefined): void {
    setOperators(() => updateOperators)
  }

  async function handleSearch(searchText: string) {
    setSearch(() => searchText)
  }

  async function handleReset() {
    setSearch(() => '')
  }

  function callUser(phoneNumber: string): void {
    log(phoneNumber)
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

  function handleSelectedSpeedDial(id: string, name: string, speeddial_num: string) {
    setIsEditingSpeedDial(true)
    setSelectedSpeedDial(() => ({ id: id, name: name, speeddial_num: speeddial_num }))
  }

  async function handleAddContactToPhonebook(contact: ContactType) {
    const [_, err] = await window.api.addContactToPhonebook(contact)
    if (!!err) throw err
    setSearch(() => '')
    setSelectedMissedCall(() => null)
  }

  async function handleAddContactToSpeedDials(contact: NewContactType) {
    const [_, err] = await window.api.addContactSpeedDials(contact)
    if (!!err) throw err
    setIsCreatingSpeedDial(() => false)
    setSearch(() => '')
  }

  async function handleEditContactToSpeedDials(
    editContact: NewSpeedDialType,
    currentContact: ContactType
  ) {
    const [_, err] = await window.api.editSpeedDialContact(editContact, currentContact)
    if (!!err) throw err
    setIsEditingSpeedDial(false)
    setSelectedSpeedDial(() => null)
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

  function hideNethLink() {
    window.api.hideNethLink()
  }
  function goToNethVoicePage(): void {
    window.api.openNethVoicePage('https://cti.demo-heron.sf.nethserver.net')
  }

  function handleDeleteSpeedDial(): void {
    //Da aggiungere window.api
    alert('Elimina')
  }

  return (
    <div className="h-[100vh] w-[100vw] overflow-hidden">
      {account && theme && (
        <div className={theme}>
          <div className="absolute container w-full h-full overflow-hidden flex flex-col justify-end items-center font-poppins text-sm dark:text-gray-200 text-gray-900">
            <div className="flex flex-col dark:bg-gray-900 bg-gray-50 min-w-[400px] min-h-[380px] h-full z-10 rounded-md items-center justify-between">
              <div className="flex flex-row ">
                <div className="flex flex-col gap-4 w-full">
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
                        ) : isEditingSpeedDial && selectedSpeedDial ? (
                          <EditSpeedDialBox
                            selectedId={selectedSpeedDial.id}
                            selectedName={selectedSpeedDial.name}
                            selectedNumber={selectedSpeedDial.speeddial_num}
                            onCancel={() => {
                              setIsEditingSpeedDial(false)
                              setSelectedSpeedDial(null)
                            }}
                            handleEditContactToSpeedDials={handleEditContactToSpeedDials}
                          // Passa qui le prop necessarie per il componente EditSpeedDialBox
                          />
                        ) : (
                          <SpeedDialsBox
                            speeddials={speeddials}
                            callUser={callUser}
                            showCreateSpeedDial={() => setIsCreatingSpeedDial(true)}
                            handleSelectedSpeedDial={handleSelectedSpeedDial}
                            handleDeleteSpeedDial={handleDeleteSpeedDial}
                          />
                        )
                      ) : (
                        <MissedCallsBox
                          missedCalls={missedCalls}
                          title={`${t('QueueManager.Missed calls')} (${missedCalls.length})`}
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
                          selectedNumber={selectedMissedCall.number}
                          selectedCompany={selectedMissedCall.company}
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
              <div
                className="absolute bottom-0 flex justify-center items-center py-[2px] w-full bg-gray-900 hover:bg-gray-600 z-[100] rounded-b-md"
                onClick={hideNethLink}
              >
                <FontAwesomeIcon className="dark:text-white" icon={faChevronDown} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


