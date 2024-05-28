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
  faTriangleExclamation as WarningIcon
} from '@fortawesome/free-solid-svg-icons'
import { log } from '@shared/utils/logger'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { t } from 'i18next'
import { Modal } from '@renderer/components/Modal'
import { Button } from '@renderer/components/Nethesis'
import { SpeedDialFormBox } from '@renderer/components/SpeedDialFormBox'
import { useSubscriber } from '@renderer/hooks/useSubscriber'
import { sendNotification, truncate } from '@renderer/utils'
import { getIsPhoneNumber } from '@renderer/lib/utils'

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
  const [loadData, setLoadData] = useLocalStoreState<boolean>('loadDataEnded')
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
  }, true)
  useEffect(() => {
    if (search.length >= 3) {
      debouncer(
        'search',
        () => {
          window.api.sendSearchText(search)
        },
        250
      )
    }
  }, [search])

  function initialize() {
    Notification.requestPermission().then(() => {
      log("requested notification permission")
    }).catch((e) => {
      log(e)
    })
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
    window.api.onQueueLoaded(onQueueUpdate)
    window.api.onUpdateAppNotification(showUpdateAppNotification)
    window.api.onLoadDataEnd(onLoadDataEnd)

  }

  const onLoadDataEnd = () => {
    log('end')
    setLoadData(true)
  }

  const showUpdateAppNotification = () => {
    log('UPDATE')
    const updateLink = 'https://nethesis.github.io/nethlink/'
    sendNotification(
      t('Notification.application_update_title'),
      t('Notification.application_update_body'),
      updateLink
    )
  }

  function onMainPresence(op: { [username: string]: any }) {
    log('onMainPresence', operatorsRef.current, op)
    // eslint-disable-next-line no-prototype-builtins
    const updatedOperators = {
      operators: operatorsRef.current?.operators || {},
      userEndpoints: operatorsRef.current?.operators || {},
      //the other data only comes to me from the fetch and so I can take it as valid
      avatars: operatorsRef.current?.avatars || {},
      groups: operatorsRef.current?.groups || {},
      extensions: operatorsRef.current?.extensions || {},
    }
    for (const [username, operator] of Object.entries(op)) {
      log(
        'presence of operators onMainPresence',
        updatedOperators.operators![username]?.mainPresence,
        operator.mainPresence,
        username
      )
      updatedOperators.operators[username] = {
        ...(updatedOperators.operators[username] || operator),
        mainPresence: operator.mainPresence
      }
      log('change operators', operatorsRef.current, op)
    }
    saveOperators(updatedOperators, true)
  }

  function onQueueUpdate(queues: { [queueId: string]: any }) {
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

  function saveOperators(updateOperators: OperatorData | undefined, forceUpdate: boolean = false): void {
    log('UPDATE OPERATORS', updateOperators)
    // eslint-disable-next-line no-prototype-builtins    
    if (updateOperators) {
      const newOperators = {
        operators: operatorsRef.current?.operators || {},
        userEndpoints: operatorsRef.current?.operators || {},
        //the other data only comes to me from the fetch and so I can take it as valid
        avatars: updateOperators.avatars,
        groups: updateOperators.groups,
        extensions: updateOperators.extensions,
      }
      for (const [username, operator] of Object.entries(updateOperators.operators)) {
        log(
          'presence of operators',
          operatorsRef.current?.operators?.[username]?.mainPresence,
          operator.mainPresence,
          username
        )
        newOperators.operators[username] = {
          ...(newOperators.operators[username] || operator),
          mainPresence: forceUpdate ? operator.mainPresence : (newOperators.operators[username]?.mainPresence || operator.mainPresence),
        }
      }
      setOperators(newOperators)
    }
  }

  async function handleSearch(searchText: string) {
    setSearch(() => searchText)
  }

  async function handleReset() {
    setSearch(() => '')
  }

  function callUser(phoneNumber: string): void {
    window.api.startCall(phoneNumber)
  }

  function logout(): void {
    setSearch(() => '')
    window.api.logout()
  }

  //FUNCTION FOR THE CASE WHEN ADDING A NEW CONTACT TO BE CREATED IN MISSEDCALL
  function handleSelectedMissedCall(number: string, company: string | undefined) {
    if (company === undefined) {
      setSelectedMissedCall(() => ({ number, company: '' }))
    } else setSelectedMissedCall(() => ({ number, company }))
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
        log('delete speeddials', deleteSpeeddial, _)
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



  return (
    <div className="h-[100vh] w-[100vw] overflow-hidden">
      {account && (
        <div className="absolute container w-full h-full overflow-hidden flex flex-col justify-end items-center text-sm">
          <div
            className={`flex flex-col min-w-[400px] min-h-[380px] h-full items-center justify-between`}
          >
            <div
              className={`draggableAnchor flex justify-end ${navigator.userAgent.includes('Windows') ? 'flex-row' : 'flex-row-reverse'} gap-1 items-center pr-4 pl-2 pb-[18px] pt-[8px] w-full bg-gray-950 dark:bg-gray-950 rounded-lg relative bottom-[-8px] z-0`}
            >
              <FontAwesomeIcon
                className={` text-yellow-500 hover:text-yellow-400 cursor-pointer ml-2 noDraggableAnchor`}
                icon={MinimizeIcon}
                onClick={hideNethLink}
              />
            </div>
            <div className="flex flex-row rounded-lg relative z-10 bottom-1 dark:bg-bgDark bg-bgLight w-full">
              <div className="flex flex-col gap-3 w-full">
                <Navbar
                  search={search}
                  account={account}
                  callUser={callUser}
                  onSelectTheme={handleOnSelectTheme}
                  logout={logout}
                  handleSearch={handleSearch}
                  handleReset={handleReset}
                  goToNethVoicePage={goToNethVoicePage}
                  exitNethLink={exitNethLink}
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
                    {search !== '' && !selectedMissedCall ? (
                      <div className="absolute top-0 left-0 z-[100] dark:bg-bgDark bg-bgLight h-full w-full rounded-bl-lg">
                        <SearchNumberBox
                          searchText={search}
                          showAddContactToPhonebook={() => setSelectedMissedCall(() => ({}))}
                          callUser={callUser}
                        />
                      </div>
                    ) : null}
                    {selectedMissedCall ? (
                      <div className="absolute top-0 left-0 z-[100] dark:bg-bgDark bg-bgLight h-full w-full rounded-bl-lg">
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
                <Modal
                  show={showDeleteModal}
                  focus={cancelDeleteButtonRef}
                  onClose={() => setShowDeleteModal(false)}
                  afterLeave={() => setSelectedSpeedDial(undefined)}
                  themeMode={themeMode}
                  className="font-Poppins"
                >
                  <Modal.Content>
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 bg-bgAmberLight dark:bg-bgAmberDark">
                      <FontAwesomeIcon
                        icon={WarningIcon}
                        className="h-6 w-6 text-iconAmberLight dark:text-iconAmberDark"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="font-medium text-[18px] leading-7 text-titleLight dark:text-titleDark">
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
                      className="font-medium text-[14px] leading-5 gap-3"
                      onClick={() => {
                        setShowDeleteModal(false)
                        setSelectedSpeedDial(undefined)
                      }}
                      ref={cancelDeleteButtonRef}
                    >
                      <p className="dark:text-textBlueDark text-textBlueLight">
                        {t('Common.Cancel')}
                      </p>
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
