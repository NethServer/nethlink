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
  OperatorData,
  QueuesType
} from '@shared/types'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { SearchNumberBox } from '@renderer/components/SearchNumberBox'
import { PHONE_ISLAND_EVENTS } from '@shared/constants'
import { debouncer } from '@shared/utils/utils'
import { AddToPhonebookBox } from '@renderer/components/AddToPhonebookBox'
import { useLocalStoreState } from '@renderer/hooks/useLocalStoreState'
import {
  faMinusCircle as MinimizeIcon,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons'
import { log } from '@shared/utils/logger'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { t } from 'i18next'
import { Modal } from '@renderer/components/Modal'
import { Button } from '@renderer/components/Nethesis'
import avatar from '../assets/TrayLogo.png'
import { SpeedDialFormBox } from '@renderer/components/SpeedDialFormBox'

export function NethLinkPage() {
  const [search, setSearch] = useState('')
  const [account, setAccount, accountRef] = useLocalStoreState<Account>('user')
  const [selectedMenu, setSelectedMenu] = useState<MENU_ELEMENT>(MENU_ELEMENT.SPEEDDIALS)
  const [speeddials, setSpeeddials] = useState<ContactType[]>([])
  const [missedCalls, setMissedCalls] = useState<CallData[]>([])
  const [operators, setOperators, operatorsRef] = useLocalStoreState<OperatorData>('operators')
  const [queues, setQueues, queuesRef] = useLocalStoreState<QueuesType>('queues')
  const [selectedMissedCall, setSelectedMissedCall] = useState<{
    number?: string
    company?: string
  } | null>(null)
  const [selectedSpeedDial, setSelectedSpeedDial] = useState<ContactType>()
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const cancelDeleteButtonRef = useRef() as MutableRefObject<HTMLButtonElement>
  const [showSpeedDialForm, setShowSpeedDialForm] = useState<boolean>(false)

  useInitialize(() => {
    initialize()
    //log('USERAGENT', navigator.userAgent.includes('Linux'))
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
    window.api.addPhoneIslandListener(
      PHONE_ISLAND_EVENTS['phone-island-queue-update'],
      onQueueUpdate
    )
    window.api.onReceiveSpeeddials(saveSpeeddials)
    window.api.onReceiveLastCalls(saveMissedCalls)
    window.api.onOperatorsChange(saveOperators)
    window.api.onSystemThemeChange((theme) => {
      updateTheme(theme)
    })
  }

  const updateTheme = (theme: AvailableThemes) => {
    log('FROM WINDOW', theme)
    if (accountRef.current!.theme === 'system') {
      setTheme(() => theme)
    }
  }

  function onMainPresence(op: { [username: string]: any }) {
    log('onMainPresence', operatorsRef.current, op)
    // eslint-disable-next-line no-prototype-builtins
    if (operatorsRef.current?.hasOwnProperty('operators')) {
      for (const [username, operator] of Object.entries(op)) {
        log(
          'presence of operators',
          operatorsRef.current.operators[username].mainPresence,
          operator.mainPresence
        )
        operatorsRef.current.operators[username].mainPresence = operator.mainPresence
      }
      debouncer('onMainPresence', () => setOperators(operatorsRef.current))
    }
  }

  function onQueueUpdate(queues: { [queueId: string]: any }) {
    log('onQueueUpdate', queuesRef.current, queues)
    queuesRef.current = {
      ...queuesRef.current,
      ...queues
    }
    debouncer('onQueueUpdate', () => setQueues(queuesRef.current))
  }

  function updateAccount(account: Account | undefined) {
    setAccount(account)
  }

  async function saveSpeeddials(speeddialsResponse: ContactType[] | undefined) {
    setSpeeddials(() => speeddialsResponse || [])
  }

  async function saveMissedCalls(historyResponse: HistoryCallData | undefined) {
    setMissedCalls(() => historyResponse?.rows || [])
  }

  function saveOperators(updateOperators: OperatorData | undefined): void {
    //log('UPDATE OPERATORS', operators, updateOperators)
    setOperators(updateOperators)
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
    setSearch(() => '')
    window.api.logout()
  }

  //FUNZIONE PER IL CASO IN CUI SI AGGIUNGE UN NUOVO CONTATTO DA CREATE IN MISSEDCALL
  function handleSelectedMissedCall(number: string, company: string | undefined) {
    if (company === undefined) {
      setSelectedMissedCall(() => ({ number, company: '' }))
    } else setSelectedMissedCall(() => ({ number, company }))
    console.log('SELECTED MISSED CALL', selectedMissedCall)
  }

  function handleSelectedSpeedDial(selectedSpeedDial: ContactType) {
    setSelectedSpeedDial(() => selectedSpeedDial)
    setShowSpeedDialForm(true)
  }

  async function handleAddContactToPhonebook(contact: ContactType) {
    const [_, err] = await window.api.addContactToPhonebook(contact)
    if (err) {
      sendNotification(
        t('Notification.contact_not_created_title'),
        t('Notification.contact_not_created_description')
      )
      throw err
    }
    setSearch(() => '')
    setSelectedMissedCall(() => null)
    sendNotification(
      t('Notification.contact_created_title'),
      t('Notification.contact_created_description')
    )
  }

  async function handleAddContactToSpeedDials(contact: NewContactType) {
    const [createdSpeedDial, err] = await window.api.addContactSpeedDials(contact)
    if (err) {
      sendNotification(
        t('Notification.speeddial_not_created_title'),
        t('Notification.speeddial_not_created_description')
      )
      throw err
    }
    setSpeeddials(() => [...speeddials, createdSpeedDial as ContactType])
    setShowSpeedDialForm(false)
    setSearch(() => '')
    sendNotification(
      t('Notification.speeddial_created_title'),
      t('Notification.speeddial_created_description')
    )
  }

  async function handleEditContactToSpeedDials(
    editContact: NewSpeedDialType,
    currentContact: ContactType
  ) {
    const [editedSpeedDial, err] = await window.api.editSpeedDialContact(
      editContact,
      currentContact
    )
    if (err) {
      sendNotification(
        t('Notification.speeddial_not_modified_title'),
        t('Notification.speeddial_not_modified_description')
      )
      throw err
    }
    const newSpeedDials = speeddials.map((speedDial) => {
      if (speedDial.id?.toString() === editedSpeedDial?.id) {
        return editedSpeedDial!
      }
      return speedDial
    })
    setSpeeddials(() => newSpeedDials)
    setShowSpeedDialForm(false)
    setSelectedSpeedDial(undefined)
    sendNotification(
      t('Notification.speeddial_modified_title'),
      t('Notification.speeddial_modified_description')
    )
  }

  async function handleSubmitContact(data: NewContactType | NewSpeedDialType) {
    if (selectedSpeedDial) {
      await handleEditContactToSpeedDials(data as NewSpeedDialType, selectedSpeedDial)
    } else {
      await handleAddContactToSpeedDials(data as NewContactType)
    }
  }

  function handleSidebarMenuSelection(menuElement: MENU_ELEMENT): void {
    setSelectedMenu(() => menuElement)
    setSearch(() => '')
    setShowSpeedDialForm(false)
    setSelectedMissedCall(() => null)
  }

  function handleOnSelectTheme(theme: AvailableThemes) {
    window.api.changeTheme(theme)
    accountRef.current!.theme = theme
    setAccount(accountRef.current)
  }

  function viewAllMissedCalls(): void {
    window.api.openHostPage('/history')
  }

  function hideNethLink() {
    window.api.hideNethLink()
  }
  function goToNethVoicePage(): void {
    window.api.openHostPage('/')
  }

  function handleDeleteSpeedDial(deleteSpeeddial: ContactType) {
    setSelectedSpeedDial(deleteSpeeddial)
    setShowDeleteModal(true)
  }

  async function confirmDeleteSpeedDial(deleteSpeeddial: ContactType) {
    const [eliminatedSpeedDial, err] = await window.api.deleteSpeedDial(deleteSpeeddial)
    if (err) {
      sendNotification(
        t('Notification.speeddial_not_deleted_title'),
        t('Notification.speeddial_not_deleted_description')
      )
      throw err
    }
    setSpeeddials(() =>
      speeddials.filter((speeddial) => speeddial.id?.toString() !== eliminatedSpeedDial)
    )
    setSelectedSpeedDial(undefined)
    setShowDeleteModal(false)
    sendNotification(
      t('Notification.speeddial_deleted_title'),
      t('Notification.speeddial_deleted_description')
    )
  }

  function sendNotification(title: string, body: string) {
    new Notification(title, {
      body,
      icon: avatar
    })
  }

  return (
    <div className="h-[100vh] w-[100vw] overflow-hidden">
      {account && theme && (
        <div className={theme}>
          <div className="absolute container w-full h-full overflow-hidden flex flex-col justify-end items-center font-poppins text-sm dark:text-gray-200 text-gray-900">
            <div
              className={`flex flex-col-reverse  min-w-[400px] min-h-[380px] h-full items-center justify-between`}
            >
              <div
                className={`flex justify-center items-center pb-[2px] pt-[8px] w-full bg-gray-200 hover:bg-gray-400 dark:bg-gray-950 dark:hover:bg-gray-700 rounded-b-md relative bottom-[1px] z-0`}
                onClick={hideNethLink}
              >
                <div className="flex justify-center items-center">
                  <p>{t('Common.Minimize')}</p>
                  <FontAwesomeIcon
                    className={`text-gray-900 dark:text-white ml-2 `}
                    icon={MinimizeIcon}
                  />
                </div>
              </div>
              <div className="flex flex-row rounded-md relative bottom-[-4px] z-10  dark:bg-gray-900 bg-gray-50 w-full">
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
                  <div className="relative w-full">
                    <div className="px-4 w-full h-[284px] pb-2 z-1">
                      {selectedMenu === MENU_ELEMENT.SPEEDDIALS ? (
                        showSpeedDialForm ? (
                          <SpeedDialFormBox
                            initialData={selectedSpeedDial}
                            onSubmit={handleSubmitContact}
                            onCancel={() => {
                              setShowSpeedDialForm(false)
                              setSelectedSpeedDial(() => undefined)
                            }}
                          />
                        ) : (
                          <SpeedDialsBox
                            speeddials={speeddials}
                            callUser={callUser}
                            showCreateSpeedDial={() => setShowSpeedDialForm(true)}
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
                      {search !== '' && !selectedMissedCall ? (
                        <div className="absolute top-0 left-0 z-[100] dark:bg-gray-900 bg-gray-50 h-full w-full">
                          <SearchNumberBox
                            searchText={search}
                            showAddContactToPhonebook={() => setSelectedMissedCall(() => ({}))}
                            callUser={callUser}
                          />
                        </div>
                      ) : null}
                      {selectedMissedCall ? (
                        <div className="absolute top-0 left-0 z-[100] dark:bg-gray-900 bg-gray-50 h-full w-full">
                          <AddToPhonebookBox
                            searchText={search}
                            selectedNumber={selectedMissedCall.number}
                            selectedCompany={selectedMissedCall.company}
                            handleAddContactToPhonebook={handleAddContactToPhonebook}
                            onCancel={() => {
                              setSelectedMissedCall(() => undefined)
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {/* Modal per l'eliminazione di una speedDials */}
                  <Modal
                    show={showDeleteModal}
                    focus={cancelDeleteButtonRef}
                    onClose={() => setShowDeleteModal(false)}
                    afterLeave={() => setSelectedSpeedDial(undefined)}
                    className={theme}
                  >
                    <Modal.Content>
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 bg-red-100 dark:bg-red-900">
                        <FontAwesomeIcon
                          icon={faTriangleExclamation}
                          className="h-6 w-6 text-red-600 dark:text-red-200"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                          {t('SpeedDial.Delete speed dial')}
                        </h3>
                        <div className="mt-3">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('SpeedDial.Speed dial delete message', {
                              deletingName: selectedSpeedDial?.name
                            })}
                          </p>
                        </div>
                      </div>
                    </Modal.Content>
                    <Modal.Actions>
                      <Button
                        variant="danger"
                        onClick={() => {
                          setShowDeleteModal(false)
                          confirmDeleteSpeedDial(selectedSpeedDial!)
                        }}
                      >
                        {t('Common.Delete')}
                      </Button>
                      <Button
                        variant="white"
                        onClick={() => {
                          setSelectedSpeedDial(undefined)
                          setShowDeleteModal(false)
                        }}
                        ref={cancelDeleteButtonRef}
                      >
                        {t('Common.Cancel')}
                      </Button>
                    </Modal.Actions>
                  </Modal>
                </div>
                <Sidebar
                  selectedMenu={selectedMenu}
                  handleSidebarMenuSelection={handleSidebarMenuSelection}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
