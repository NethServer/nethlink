import { Navbar } from '../components/Modules/NethVoice/BaseModule/Navbar'
import { useInitialize } from '../hooks/useInitialize'
import { MutableRefObject, useEffect, useRef } from 'react'
import { Log } from '@shared/utils/logger'
import { t } from 'i18next'
import { useSharedState } from '@renderer/store'
import { NethLinkModules } from '@renderer/components/Modules'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { IPC_EVENTS, PERMISSION } from '@shared/constants'
import { ConnectionErrorDialog } from '@renderer/components'
import { debouncer } from '@shared/utils/utils'
import { useAccount } from '@renderer/hooks/useAccount'
import { Sidebar } from '@renderer/components/Modules/NethVoice/BaseModule/Sidebar'


export interface NethLinkPageProps {
  handleRefreshConnection: () => void
}

export function NethLinkPage({ handleRefreshConnection }: NethLinkPageProps) {
  const [account, setAccount] = useSharedState('account')
  const [, setNotifications] = useSharedState('notifications')
  const [connection] = useSharedState('connection')
  const { hasPermission } = useAccount()
  const isFetching = useRef<boolean>(false)

  const { saveOperators, onQueueUpdate, onParkingsUpdate, saveLastCalls, saveSpeeddials, onMainPresence, updateLastCalls, updateParkings } =
    usePhoneIslandEventHandler()

  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const operatorFetchLoopInterval = useRef<NodeJS.Timeout>()
  const accountMeInterval = useRef<NodeJS.Timeout>()

  useInitialize(() => {
    initialize()
  })

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
      }
    } else {
      Log.info('Account logout')
      stopInterval(operatorFetchLoopInterval)
      stopInterval(accountMeInterval)
    }
  }, [account?.username])

  function stopInterval(interval: MutableRefObject<NodeJS.Timeout | undefined>) {
    if (interval.current) {
      clearInterval(interval.current)
      interval.current = undefined
    }
  }

  function initialize() {
    Notification.requestPermission()
      .then(() => {
        Log.info('requested notification permission')
      })
      .catch((e) => {
        Log.warning('notification permission error or unsuccessfully acquired', e)
      })
    window.electron.receive(IPC_EVENTS.UPDATE_APP_NOTIFICATION, showUpdateAppNotification)
    window.electron.receive(IPC_EVENTS.EMIT_CALL_END, updateLastCalls)
    window.electron.receive(IPC_EVENTS.EMIT_MAIN_PRESENCE_UPDATE, onMainPresence)
    window.electron.receive(IPC_EVENTS.EMIT_PARKING_UPDATE, updateParkings)
    window.electron.receive(IPC_EVENTS.EMIT_QUEUE_UPDATE, onQueueUpdate)
  }

  const showUpdateAppNotification = () => {
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
    Log.info('RELOAD DATA', isFetching.current)
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
    if (connection) {
      Log.info('RECONNECT')
      debouncer('nethlink-reconnect', () => {
        Log.info('EFFECTIVE RECONNECT')
        reconnect()
      }, 3000)
    }
  }, [connection])

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
