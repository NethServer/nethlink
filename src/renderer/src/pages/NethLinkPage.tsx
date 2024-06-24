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

} from '@shared/types'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { debouncer } from '@shared/utils/utils'
import {
  faMinusCircle as MinimizeIcon,
  faTriangleExclamation as WarningIcon
} from '@fortawesome/free-solid-svg-icons'
import { log } from '@shared/utils/logger'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { t } from 'i18next'
import { sendNotification } from '@renderer/utils'
import { useStoreState } from '@renderer/store'
import { useNethVoiceAPI } from '@shared/useNethVoiceAPI'
import { NethLinkModules } from '@renderer/components/Modules'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { MENU_ELEMENT } from '@shared/constants'

export interface NethLinkPageProps {
  themeMode: string
}

export function NethLinkPage({ themeMode }: NethLinkPageProps) {

  const [account, setAccount] = useStoreState<Account | undefined>('account')
  const [nethLinkPageData, setNethLinkPageData] = useStoreState<NethLinkPageData>('nethLinkPageData')

  const {
    saveOperators,
    onQueueUpdate,
    saveLastCalls,
    saveSpeeddials
  } = usePhoneIslandEventHandler()

  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const operatorFetchLoopInterval = useRef<NodeJS.Timeout>()

  useInitialize(() => {
    initialize()
  }, true)

  useEffect(() => {
    if (account) {
      if (!operatorFetchLoopInterval.current) {
        log('account changed', account.username)
        loadData()
        operatorFetchLoopInterval.current = setInterval(() => {
          loadData()
        }, 1000 * 60 * 60 * 24)
        setNethLinkPageData({
          selectedSidebarMenu: MENU_ELEMENT.SPEEDDIALS,
          phonebookModule: {
            selectedContact: undefined,
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
      log('ACCOUNT', account)
    } else {
      log('account logout')
      if (operatorFetchLoopInterval.current) {
        clearInterval(operatorFetchLoopInterval.current)
        operatorFetchLoopInterval.current = undefined
      }
      //initialize nethLink data
    }
  }, [account?.username])

  // useEffect(() => {
  //   debouncer('reload-data', () => loadData(), 1000)
  // }, [nethLinkPageData?.selectedSidebarMenu])

  function initialize() {
    Notification.requestPermission().then(() => {
      log("requested notification permission")
    }).catch((e) => {
      log(e)
    })
    window.api.onUpdateAppNotification(showUpdateAppNotification)
  }

  const showUpdateAppNotification = () => {
    const updateLink = 'https://nethesis.github.io/nethlink/'
    sendNotification(
      t('Notification.application_update_title'),
      t('Notification.application_update_body'),
      updateLink
    )
  }

  async function loadData() {
    NethVoiceAPI.fetchOperators().then(saveOperators)
    NethVoiceAPI.HistoryCall.interval().then(saveLastCalls)
    NethVoiceAPI.Phonebook.getSpeeddials().then(saveSpeeddials)
    NethVoiceAPI.AstProxy.getQueues().then(onQueueUpdate)
    NethVoiceAPI.User.me().then((me) => {
      log('ME', me)
      setAccount((p) => ({
        ...p!,
        data: me
      }))
    })
  }

  function hideNethLink() {
    window.api.hideNethLink()
  }

  return (
    <div className="h-[100vh] w-[100vw] overflow-hidden">
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
              <Navbar />
              <div className="relative w-full">
                <div className="w-full h-[274px] pb-2 z-1">
                  <NethLinkModules />
                </div>
              </div>
            </div>
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  )
}
