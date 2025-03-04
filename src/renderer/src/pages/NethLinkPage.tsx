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
import { sendNotification } from '@renderer/utils'


export interface NethLinkPageProps {
  handleRefreshConnection: () => void
}

export function NethLinkPage({ handleRefreshConnection }: NethLinkPageProps) {
  const [account] = useSharedState('account')
  const [, setNotifications] = useSharedState('notifications')
  const [connection] = useSharedState('connection')
  const { hasPermission, updateAccountData } = useAccount()
  const isFetching = useRef<boolean>(false)

  const { saveOperators, onQueueUpdate, onParkingsUpdate, saveLastCalls, saveSpeeddials, onMainPresence, updateLastCalls, updateParkings } =
    usePhoneIslandEventHandler()

  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const accountMeInterval = useRef<NodeJS.Timeout>()

  useInitialize(() => {
    initialize()
  })

  useEffect(() => {
    if (account) {
      if (!accountMeInterval.current) {
        loadData()
        accountMeInterval.current = setInterval(loadData,
          1000 * 60 * 5
        )
      }
    } else {
      Log.info('Account logout')
      stopInterval(accountMeInterval)
    }
  }, [account?.username])

  function stopInterval(interval: MutableRefObject<NodeJS.Timeout | undefined>) {
    if (interval.current) {
      clearInterval(interval.current)
      interval.current = undefined
    }
  }

  function handleStartCallByUrlResponse(isValid: boolean) {
    if (!isValid) {
      const phone = account?.data?.default_device.description || t('Settings.IP Phone')
      sendNotification(t('Common.Warning'), t('Notification.physical_phone_error', { phone }))
    }
  }

  function initialize() {
    Log.info('INITIALIZE NETHLINK FRONTEND')
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
    window.electron.receive(IPC_EVENTS.UPDATE_ACCOUNT, updateAccountData)
    window.electron.receive(IPC_EVENTS.RESPONSE_START_CALL_BY_URL, handleStartCallByUrlResponse)
    window.electron.receive(IPC_EVENTS.RECONNECT_SOCKET, handleSocketReconnect)
  }

  const handleSocketReconnect = () => {
    window.location.reload()
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

  async function loadData() {
    Log.info('update account', { isFetching: isFetching.current })
    if (!isFetching.current) {
      isFetching.current = true
      try {
        const results = await Promise.all([
          updateAccountData(),
          NethVoiceAPI.fetchOperators().then(saveOperators),
          NethVoiceAPI.HistoryCall.interval().then(saveLastCalls),
          NethVoiceAPI.AstProxy.getQueues().then(onQueueUpdate),
          ...[
            hasPermission(PERMISSION.PARKINGS) ? NethVoiceAPI.AstProxy.getParkings().then(onParkingsUpdate) : []
          ],
          NethVoiceAPI.Phonebook.getSpeeddials().then(saveSpeeddials)
        ])
        Log.debug(results)
        const firstError = results.find(e => e)
        if (firstError) {
          throw firstError
        }
        debouncer('loadData', () => {
          isFetching.current = false
        }, 2000)
      } catch (e: any) {
        Log.warning(e)
        if (e['status'] === 401) {
          Log.error(e)
          window.electron.send(IPC_EVENTS.RESUME)
        }
      }
    }
  }

  useEffect(() => {
    if (connection) {
      Log.info('CONNECTION CHANGE')
      loadData()
    }
  }, [connection])

  return (
    <div className="h-[100vh] w-[100vw] ">
      <div className="absolute w-full h-full  flex flex-col justify-end items-center text-sm">
        <div className={`flex flex-col h-full w-full items-center justify-between`}>
          <div className="relative flex flex-row z-10 dark:bg-bgDark bg-bgLight w-full h-full">
            <div className="flex flex-col gap-3 w-full h-full">
              <Navbar onClickAccount={() => updateAccountData()} />
              <NethLinkModules />
            </div>
            <Sidebar onChangeMenu={() => loadData()} />
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
