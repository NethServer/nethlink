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
  NotificationData,
  PhoneIslandPageData
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
import { FilterTypes, IPC_EVENTS, MENU_ELEMENT, PERMISSION } from '@shared/constants'
import { PresenceBadge } from '@renderer/components/Modules/NethVoice/Presence/PresenceBadge'
import classNames from 'classnames'
import { ConnectionErrorDialog } from '@renderer/components'
import { debouncer, isDev } from '@shared/utils/utils'
import { useAccount } from '@renderer/hooks/useAccount'
import { FavouriteFilter } from '@renderer/components/Modules/NethVoice/Speeddials/Favourites/FavouriteFilter'


export interface NethLinkPageProps {
  themeMode: string,
  handleRefreshConnection: () => void
}

export function NethLinkPage({ themeMode, handleRefreshConnection }: NethLinkPageProps) {
  const [account, setAccount] = useStoreState<Account | undefined>('account')
  const [phoneIslandPageData] = useStoreState<PhoneIslandPageData>('phoneIslandPageData')
  const [, setNethLinkPageData] = useStoreState<NethLinkPageData>('nethLinkPageData')
  const [, setNotifications] = useStoreState<NotificationData>('notifications')
  const [connection] = useStoreState<boolean>('connection')
  const { hasPermission } = useAccount()
  const isFetching = useRef<boolean>(false)

  const { saveOperators, onQueueUpdate, onParkingsUpdate, saveLastCalls, saveSpeeddials } =
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
          selectedSidebarMenu: MENU_ELEMENT.FAVOURITES,
          phonebookModule: {
            selectedContact: undefined
          },
          speeddialsModule: {
            selectedSpeedDial: undefined,
            selectedFavourite: undefined,
            favouriteOrder: FilterTypes.AZ

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

  useEffect(() => {
    log('connection effect', connection)
  }, [connection])

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
    const updateLink = 'https://nethserver.github.io/nethlink/'
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

    NethVoiceAPI.AstProxy.getQueues().then(onQueueUpdate)
    if (hasPermission(PERMISSION.PARKINGS))
      NethVoiceAPI.AstProxy.getParkings().then(onParkingsUpdate)
    reloadData()
  }

  async function reloadData() {
    log('RELOAD DATA', isFetching.current)
    if (!isFetching.current) {
      isFetching.current = true
      NethVoiceAPI.Phonebook.getSpeeddials().then(saveSpeeddials)
      me()
    }
    debouncer('speeddial-fetch', () => {
      isFetching.current = false
    }, 1000)
  }

  useEffect(() => {
    if (!phoneIslandPageData?.isDisconnected && connection) {
      reconnect()
      log('RECONNECT')
    }
  }, [phoneIslandPageData?.isDisconnected, connection])

  const reconnect = async () => {
    loadData()
  }

  return (
    <div className="h-[100vh] w-[100vw] ">
      <div className="absolute w-full h-full  flex flex-col justify-end items-center text-sm">
        <div className={`flex flex-col h-full w-full items-center justify-between`}>
          <div className="relative flex flex-row z-10 dark:bg-bgDark bg-bgLight w-full h-full">
            <div className="flex flex-col gap-3 w-full h-full">
              <Navbar onClickAccount={() => me()} />
              <NethLinkModules />
            </div>
            <Sidebar onChangeMenu={() => reloadData()} />
          </div>
        </div>
      </div>
      {!connection && <ConnectionErrorDialog
        variant='nethlink'
        onButtonClick={handleRefreshConnection}
        buttonText={t('Common.Refresh')}
      />}
    </div>
  )
}
