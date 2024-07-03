import { Navbar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'
import { useInitialize } from '../hooks/useInitialize'
import {
  Account,
  AvailableThemes,
  NewContactType,
  ContactType,
  NewSpeedDialType,
  NethLinkPageData,
  NotificationData
} from '@shared/types'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { faMinusCircle as MinimizeIcon } from '@fortawesome/free-solid-svg-icons'
import { log } from '@shared/utils/logger'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { t } from 'i18next'
import { sendNotification } from '@renderer/utils'
import { useStoreState } from '@renderer/store'
import { useNethVoiceAPI } from '@shared/useNethVoiceAPI'
import { NethLinkModules } from '@renderer/components/Modules'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { IPC_EVENTS, MENU_ELEMENT } from '@shared/constants'
import { PresenceBadge } from '@renderer/components/Modules/NethVoice/Presence/PresenceBadge'
import classNames from 'classnames'

export interface NethLinkPageProps {
  themeMode: string
}

export function NethLinkPage({ themeMode }: NethLinkPageProps) {
  const [account, setAccount] = useStoreState<Account | undefined>('account')
  const [nethLinkPageData, setNethLinkPageData] =
    useStoreState<NethLinkPageData>('nethLinkPageData')
  const [notifications, setNotifications] = useStoreState<NotificationData>('notifications')

  const { saveOperators, onQueueUpdate, saveLastCalls, saveSpeeddials } =
    usePhoneIslandEventHandler()

  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const operatorFetchLoopInterval = useRef<NodeJS.Timeout>()
  const accountMeInterval = useRef<NodeJS.Timeout>()

  useInitialize(() => {
    initialize()
  }, true)

  useEffect(() => {
    if (account) {
      if (!operatorFetchLoopInterval.current) {
        loadData()
        operatorFetchLoopInterval.current = setInterval(
          () => {
            loadData()
          },
          1000 * 60 * 60 * 24
        )
        accountMeInterval.current = setInterval(
          () => {
            me()
          },
          1000 * 60 * 45
        )
        setNethLinkPageData({
          selectedSidebarMenu: MENU_ELEMENT.SPEEDDIALS,
          phonebookModule: {
            selectedContact: undefined
          },
          speeddialsModule: {
            selectedSpeeDial: undefined
          },
          phonebookSearchModule: {
            searchText: null
          },
          showAddContactModule: false,
          showPhonebookSearchModule: false
        })
      }
    } else {
      log('account logout')
      stopInterval(operatorFetchLoopInterval)
      stopInterval(accountMeInterval)
      //initialize nethLink data
    }
  }, [account?.username])

  function stopInterval(interval: MutableRefObject<NodeJS.Timeout | undefined>) {
    if (interval.current) {
      clearInterval(interval.current)
      interval.current = undefined
    }
  }

  // useEffect(() => {
  //   debouncer('reload-data', () => loadData(), 1000)
  // }, [nethLinkPageData?.selectedSidebarMenu])

  function initialize() {
    Notification.requestPermission()
      .then(() => {
        log('requested notification permission')
      })
      .catch((e) => {
        log(e)
      })
    window.electron.receive(IPC_EVENTS.UPDATE_APP_NOTIFICATION, showUpdateAppNotification)
  }

  const showUpdateAppNotification = () => {
    log('UPDATE')
    const updateLink = 'https://nethesis.github.io/nethlink/'
    setNotifications((p) => ({
      ...p,
      system: {
        update: {
          message: updateLink
        }
      }
    }))
  }

  function me() {
    NethVoiceAPI.User.me().then((me) => {
      setAccount((p) => ({
        ...p!,
        data: {
          ...p?.data,
          ...me
        }
      }))
    })
  }

  async function loadData() {
    NethVoiceAPI.fetchOperators().then((op) => {
      saveOperators(op)
      me()
    })
    NethVoiceAPI.HistoryCall.interval().then(saveLastCalls)
    NethVoiceAPI.Phonebook.getSpeeddials().then(saveSpeeddials)
    NethVoiceAPI.AstProxy.getQueues().then(onQueueUpdate)
    me()
  }

  function hideNethLink() {
    window.api.hideNethLink()
  }

  return (
    <div className="h-[100vh] w-[100vw] overflow-hidden">
      <div className="absolute container w-full h-full overflow-hidden flex flex-col justify-end items-center text-sm">
        <div
          className={`flex flex-col min-w-[400px] min-h-[400px] h-full items-center justify-between`}
        >
          <div
            className={classNames(
              `
              relative
              px-4
              draggableAnchor
              w-full
              h-[34px]
              flex justify-between
              items-center
              bg-gray-950 dark:bg-gray-950
              rounded-t-lg
              z-0
            `,
              !navigator.userAgent.includes('Windows') ? 'flex-row' : 'flex-row-reverse'
            )}
          >
            <PresenceBadge
              mainPresence={account?.data?.mainPresence}
              className={classNames(
                !navigator.userAgent.includes('Windows') ? 'right-4' : 'left-4'
              )}
            />
            <FontAwesomeIcon
              className={`absolute top-2 w-4 h-4 text-yellow-500 hover:text-yellow-400 cursor-pointer noDraggableAnchor`}
              icon={MinimizeIcon}
              onClick={hideNethLink}
            />
          </div>
          <div className="relative  flex flex-row rounded-b-lg z-10 dark:bg-bgDark bg-bgLight w-full h-full">
            <div className="flex flex-col gap-3 w-full h-full">
              <Navbar onClickAccount={() => me()} />
              <NethLinkModules />
            </div>
            <Sidebar onChangeMenu={() => me()} />
          </div>
        </div>
      </div>
    </div>
  )
}
