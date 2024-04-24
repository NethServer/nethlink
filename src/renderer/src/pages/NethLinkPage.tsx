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
  faXmarkCircle as ExiteIcon,
  faTriangleExclamation as WarningIcon
} from '@fortawesome/free-solid-svg-icons'
import { log } from '@shared/utils/logger'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { t } from 'i18next'
import { Modal } from '@renderer/components/Modal'
import { Button } from '@renderer/components/Nethesis'
import NotificationIcon from '../assets/TrayLogo.png'
import { SpeedDialFormBox } from '@renderer/components/SpeedDialFormBox'
import { useSubscriber } from '@renderer/hooks/useSubscriber'
import { truncate } from '@renderer/utils'

export interface NethLinkPageProps {
  themeMode: string
}

export function NethLinkPage({ themeMode }: NethLinkPageProps) {
  const [search, setSearch] = useState('')
  const account = useSubscriber<Account | undefined>('user')
  const [selectedMenu, setSelectedMenu] = useState<MENU_ELEMENT>(MENU_ELEMENT.SPEEDDIALS)
  const [speeddials, setSpeeddials] = useState<ContactType[]>([])
  const [missedCalls, setMissedCalls] = useState<CallData[]>([])
  const [operators, setOperators, operatorsRef] = useLocalStoreState<OperatorData>('operators')
  const [queues, setQueues, queuesRef] = useLocalStoreState<QueuesType>('queues')
  const [selectedMissedCall, setSelectedMissedCall] = useState<
    | {
        number?: string
        company?: string
      }
    | undefined
  >()
  const [selectedSpeedDial, setSelectedSpeedDial] = useState<ContactType>()
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const cancelDeleteButtonRef = useRef() as MutableRefObject<HTMLButtonElement>
  const [showSpeedDialForm, setShowSpeedDialForm] = useState<boolean>(false)
  const [selectedSpeedDialName, setSelectedSpeedDialName] = useState<string>('')

  useInitialize(() => {
    initialize()
    //log('USERAGENT', navigator.userAgent.includes('Linux'))
  }, true)
  useEffect(() => {
    if (search.length > 2) {
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

  function initialize() {
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
  }

  function onMainPresence(op: { [username: string]: any }) {
    //log('onMainPresence', operatorsRef.current, op)
    // eslint-disable-next-line no-prototype-builtins
    if (operatorsRef.current?.hasOwnProperty('operators')) {
      for (const [username, operator] of Object.entries(op)) {
        // log(
        //   'presence of operators',
        //   operatorsRef.current.operators[username].mainPresence,
        //   operator.mainPresence
        // )
        if (!operatorsRef.current.operators[username]) {
          operatorsRef.current.operators[username] = operator
        } else {
          operatorsRef.current.operators[username].mainPresence = operator.mainPresence
        }
      }
      log('change operators', operatorsRef.current, op)
      debouncer('onMainPresence', () => setOperators(operatorsRef.current))
    }
  }

  function onQueueUpdate(queues: { [queueId: string]: any }) {
    //log('onQueueUpdate', queuesRef.current, queues)
    queuesRef.current = {
      ...queuesRef.current,
      ...queues
    }
    debouncer('onQueueUpdate', () => setQueues(queuesRef.current))
  }

  async function saveSpeeddials(speeddialsResponse: ContactType[] | undefined) {
    setSpeeddials(() => speeddialsResponse || [])
  }

  async function saveMissedCalls(historyResponse: HistoryCallData | undefined) {
    setMissedCalls(() => historyResponse?.rows || [])
  }

  function saveOperators(updateOperators: OperatorData | undefined): void {
    log('UPDATE OPERATORS', updateOperators)
    if (updateOperators?.hasOwnProperty('operators') && operatorsRef.current?.operators) {
      //lo stato degli operatori deve arrivare dal segnale della main presence, quindi salto l'assegnazione in questo punto (dalla main presence i dati sono più aggiornati)
      updateOperators!.operators = operatorsRef.current!.operators
    }
    debouncer('onMainPresence', () => setOperators(updateOperators))
  }

  async function handleSearch(searchText: string) {
    setSearch(() => searchText)
  }

  async function handleReset() {
    setSearch(() => '')
  }

  function callUser(phoneNumber: string): void {
    //log(phoneNumber)
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
    //log('SELECTED MISSED CALL', selectedMissedCall)
  }

  function handleSelectedSpeedDial(selectedSpeedDial: ContactType) {
    setSelectedSpeedDial(() => selectedSpeedDial)
    setSelectedSpeedDialName(() => selectedSpeedDial.name!)
    setShowSpeedDialForm(true)
  }

  async function handleAddContactToPhonebook(contact: ContactType) {
    window.api
      .addContactToPhonebook(contact)
      .then(() => {
        sendNotification(
          t('Notification.contact_created_title'),
          t('Notification.contact_created_description')
        )
        setSearch(() => '')
        setSelectedMissedCall(() => undefined)
      })
      .catch((error) => {
        sendNotification(
          t('Notification.contact_not_created_title'),
          t('Notification.contact_not_created_description')
        )
      })
  }

  function handleAddContactToSpeedDials(contact: NewContactType): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      window.api
        .addContactSpeedDials(contact)
        .then((allSpeeddials) => {
          log('speeddial_created_title', allSpeeddials)
          setSpeeddials(() => [...allSpeeddials])
          sendNotification(
            t('Notification.speeddial_created_title'),
            t('Notification.speeddial_created_description')
          )
          setShowSpeedDialForm(false)
          setSearch(() => '')
          resolve()
        })
        .catch((error) => {
          sendNotification(
            t('Notification.speeddial_not_created_title'),
            t('Notification.speeddial_not_created_description')
          )
          reject(error)
        })
    })
  }

  function handleEditContactToSpeedDials(
    editContact: NewSpeedDialType,
    currentContact: ContactType
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      window.api
        .editSpeedDialContact(editContact, currentContact)
        .then((response) => {
          const newSpeedDials = speeddials.map((speedDial) =>
            speedDial.id?.toString() === response['id'] ? (response! as ContactType) : speedDial
          )
          sendNotification(
            t('Notification.speeddial_modified_title'),
            t('Notification.speeddial_modified_description')
          )
          setSpeeddials(() => newSpeedDials)
          setShowSpeedDialForm(false)
          setSelectedSpeedDial(undefined)
          resolve()
        })
        .catch((error) => {
          sendNotification(
            t('Notification.speeddial_not_modified_title'),
            t('Notification.speeddial_not_modified_description')
          )
          reject(error)
        })
    })
  }

  const handleSubmitContact = (data: NewContactType | NewSpeedDialType) =>
    selectedSpeedDial
      ? handleEditContactToSpeedDials(data as NewSpeedDialType, selectedSpeedDial)
      : handleAddContactToSpeedDials(data as NewContactType)

  function handleSidebarMenuSelection(menuElement: MENU_ELEMENT): void {
    setSelectedMenu(() => menuElement)
    setSearch(() => '')
    setShowSpeedDialForm(false)
    setSelectedMissedCall(() => undefined)
  }

  function handleOnSelectTheme(theme: AvailableThemes) {
    window.api.changeTheme(theme)
    // accountRef.current!.theme = theme
    // setAccount(accountRef.current)
  }

  function viewAllMissedCalls(): void {
    window.api.openHostPage('/history')
  }

  function hideNethLink() {
    window.api.hideNethLink()
  }

  function exitNethLink() {
    window.api.exitNethLink()
  }
  function goToNethVoicePage(): void {
    window.api.openHostPage('/')
  }

  function handleDeleteSpeedDial(deleteSpeeddial: ContactType) {
    setSelectedSpeedDial(() => deleteSpeeddial)
    setSelectedSpeedDialName(() => deleteSpeeddial.name!)
    setShowDeleteModal(true)
  }

  async function confirmDeleteSpeedDial(deleteSpeeddial: ContactType) {
    window.api
      .deleteSpeedDial(deleteSpeeddial)
      .then((_) => {
        console.log('delete speeddials', deleteSpeeddial, _)
        setSpeeddials(() =>
          speeddials.filter(
            (speeddial) => speeddial.id?.toString() !== deleteSpeeddial.id?.toString()
          )
        )
        sendNotification(
          t('Notification.speeddial_deleted_title'),
          t('Notification.speeddial_deleted_description')
        )
        setSelectedSpeedDial(undefined)
        setShowDeleteModal(false)
      })
      .catch((error) => {
        sendNotification(
          t('Notification.speeddial_not_deleted_title'),
          t('Notification.speeddial_not_deleted_description')
        )
      })
  }

  function sendNotification(title: string, body: string) {
    new Notification(title, {
      body,
      icon: NotificationIcon
    })
  }

  return (
    <div className="h-[100vh] w-[100vw] overflow-hidden">
      {account && (
        <div className="absolute container w-full h-full overflow-hidden flex flex-col justify-end items-center text-sm dark:text-gray-200 text-gray-900">
          <div
            className={`flex flex-col min-w-[400px] min-h-[380px] h-full items-center justify-between`}
          >
            <div
              className={`flex justify-end ${navigator.userAgent.includes('Windows') ? 'flex-row' : 'flex-row-reverse'} gap-1 items-center pr-4 pl-2 pb-[18px] pt-[8px] w-full bg-gray-950  dark:bg-gray-950 rounded-lg relative bottom-[-8px] z-0`}
            >
              <FontAwesomeIcon
                className={`text-yellow-500 hover:text-yellow-400 cursor-pointer ml-2 `}
                icon={MinimizeIcon}
                onClick={hideNethLink}
              />
              <FontAwesomeIcon
                className={`text-red-500 hover:text-red-400 cursor-pointer ml-2`}
                icon={ExiteIcon}
                onClick={exitNethLink}
              />
            </div>
            <div className="flex flex-row rounded-lg relative z-10 bottom-1 dark:bg-gray-900 bg-gray-50 w-full">
              <div className="flex flex-col gap-3 w-full">
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
                  <div className="w-full h-[274px] pb-2 z-1">
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
                        viewAllMissedCalls={viewAllMissedCalls}
                        handleSelectedMissedCall={handleSelectedMissedCall}
                      />
                    )}

                    {/*   MODIFICHE */}
                    {search !== '' && !selectedMissedCall ? (
                      <div className="absolute top-0 left-0 z-[100] dark:bg-gray-900 bg-gray-50 h-full w-full rounded-bl-lg">
                        <SearchNumberBox
                          searchText={search}
                          showAddContactToPhonebook={() => setSelectedMissedCall(() => ({}))}
                          callUser={callUser}
                        />
                      </div>
                    ) : null}
                    {selectedMissedCall ? (
                      <div className="absolute top-0 left-0 z-[100] dark:bg-gray-900 bg-gray-50 h-full w-full rounded-bl-lg">
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

                    {/* FINO A QUI */}
                  </div>
                </div>
                {/* Modal per l'eliminazione di una speedDials */}
                <Modal
                  show={showDeleteModal}
                  focus={cancelDeleteButtonRef}
                  onClose={() => setShowDeleteModal(false)}
                  afterLeave={() => setSelectedSpeedDial(undefined)}
                  themeMode={themeMode}
                  className="font-Poppins"
                >
                  <Modal.Content>
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 bg-amber-100 dark:bg-amber-700">
                      <FontAwesomeIcon
                        icon={WarningIcon}
                        className="h-6 w-6 text-amber-700 dark:text-amber-100"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="font-medium text-[18px] leading-7 text-gray-900 dark:text-gray-50">
                        {t('SpeedDial.Delete speed dial')}
                      </h3>
                      <div className="mt-3">
                        <p className="font-normal text-[14px] leading-5 text-gray-700 dark:text-gray-200">
                          {t('SpeedDial.Speed dial delete message', {
                            deletingName: truncate(selectedSpeedDialName || '', 30)
                          })}
                        </p>
                      </div>
                    </div>
                  </Modal.Content>
                  <Modal.Actions>
                    <Button
                      variant="danger"
                      className="font-medium text-[14px] leading-5"
                      onClick={() => {
                        setShowDeleteModal(false)
                        confirmDeleteSpeedDial(selectedSpeedDial!)
                      }}
                    >
                      {t('Common.Delete')}
                    </Button>
                    <Button
                      variant="ghost"
                      className="font-medium text-[14px] leading-5"
                      onClick={() => {
                        setShowDeleteModal(false)
                        setSelectedSpeedDial(undefined)
                      }}
                      ref={cancelDeleteButtonRef}
                    >
                      <p className="dark:text-blue-500 text-blue-700">{t('Common.Cancel')}</p>
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
      )}
    </div>
  )
}
