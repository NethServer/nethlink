import { Navbar } from '../components/Modules/NethVoice/BaseModule/Navbar'
import { useInitialize } from '../hooks/useInitialize'
import { MutableRefObject, useEffect, useRef } from 'react'
import { Log } from '@shared/utils/logger'
import { t } from 'i18next'
import { useNethlinkData, useSharedState } from '@renderer/store'
import { NethLinkModules } from '@renderer/components/Modules'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { IPC_EVENTS, PERMISSION } from '@shared/constants'
import { ConnectionBanner } from '@renderer/components'
import { debouncer } from '@shared/utils/utils'
import { useAccount } from '@renderer/hooks/useAccount'
import { Sidebar } from '@renderer/components/Modules/NethVoice/BaseModule/Sidebar'
import { sendNotification } from '@renderer/utils'
import { useChatBridge } from '@renderer/hooks/useChatBridge'
import { usePasswordExpirationWarning } from '@renderer/hooks/usePasswordExpirationWarning'

// message of the middleware for a rejected session token
const SESSION_REJECTED_MESSAGE =
  "you don't have permission to access this resource"

export interface NethLinkPageProps {
  handleRefreshConnection: () => void
}

export function NethLinkPage({ handleRefreshConnection }: NethLinkPageProps) {
  const [account] = useSharedState('account')
  usePasswordExpirationWarning(account)
  const [, setNotifications] = useSharedState('notifications')
  const [connection] = useSharedState('connection')
  const [, setIsChangePasswordDialogOpen] = useNethlinkData(
    'isChangePasswordDialogOpen',
  )
  const { hasPermission, updateAccountData } = useAccount()
  const isFetching = useRef<boolean>(false)

  const {
    saveOperators,
    onQueueUpdate,
    onQueueMemberUpdate,
    onParkingsUpdate,
    saveLastCalls,
    saveSpeeddials,
    onMainPresence,
    updateLastCalls,
    updateParkings,
  } = usePhoneIslandEventHandler()

  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const accountMeInterval = useRef<NodeJS.Timeout>()
  useChatBridge(account?.username)

  useInitialize(() => {
    Log.info('INITIALIZE NETHLINK FRONTEND')
    Notification.requestPermission()
      .then(() => {
        Log.info('requested notification permission')
      })
      .catch((e) => {
        Log.warning(
          'notification permission error or unsuccessfully acquired',
          e,
        )
      })
  })

  useEffect(() => {
    if (account) {
      window.electron.receive(
        IPC_EVENTS.UPDATE_APP_NOTIFICATION,
        showUpdateAppNotification,
      )
      window.electron.receive(IPC_EVENTS.EMIT_CALL_END, updateLastCalls)
      window.electron.receive(
        IPC_EVENTS.EMIT_MAIN_PRESENCE_UPDATE,
        onMainPresence,
      )
      window.electron.receive(IPC_EVENTS.EMIT_PARKING_UPDATE, updateParkings)
      window.electron.receive(IPC_EVENTS.EMIT_QUEUE_UPDATE, onQueueUpdate)
      window.electron.receive(
        IPC_EVENTS.EMIT_QUEUE_MEMBER_UPDATE,
        onQueueMemberUpdate,
      )
      window.electron.receive(IPC_EVENTS.UPDATE_ACCOUNT, updateAccountData)
      window.electron.receive(
        IPC_EVENTS.RESPONSE_START_CALL_BY_URL,
        handleStartCallByUrlResponse,
      )
      window.electron.receive(
        IPC_EVENTS.RECONNECT_SOCKET,
        handleSocketReconnect,
      )
      // click on the password expiration notification
      window.electron.receive(IPC_EVENTS.OPEN_CHANGE_PASSWORD, () =>
        setIsChangePasswordDialogOpen(true),
      )

      if (!accountMeInterval.current) {
        accountMeInterval.current = setInterval(loadData, 1000 * 60 * 5)
      }

      return () => {
        window.electron.removeAllListeners(IPC_EVENTS.UPDATE_APP_NOTIFICATION)
        window.electron.removeAllListeners(IPC_EVENTS.EMIT_CALL_END)
        window.electron.removeAllListeners(IPC_EVENTS.EMIT_MAIN_PRESENCE_UPDATE)
        window.electron.removeAllListeners(IPC_EVENTS.EMIT_PARKING_UPDATE)
        window.electron.removeAllListeners(IPC_EVENTS.EMIT_QUEUE_UPDATE)
        window.electron.removeAllListeners(IPC_EVENTS.EMIT_QUEUE_MEMBER_UPDATE)
        window.electron.removeAllListeners(IPC_EVENTS.UPDATE_ACCOUNT)
        window.electron.removeAllListeners(
          IPC_EVENTS.RESPONSE_START_CALL_BY_URL,
        )
        window.electron.removeAllListeners(IPC_EVENTS.RECONNECT_SOCKET)
        window.electron.removeAllListeners(IPC_EVENTS.OPEN_CHANGE_PASSWORD)
        stopInterval(accountMeInterval)
      }
    } else {
      Log.info('Account logout')
      stopInterval(accountMeInterval)
    }
  }, [account?.username])

  function stopInterval(
    interval: MutableRefObject<NodeJS.Timeout | undefined>,
  ) {
    if (interval.current) {
      clearInterval(interval.current)
      interval.current = undefined
    }
  }

  function handleStartCallByUrlResponse(isValid: boolean) {
    if (!isValid) {
      const phone =
        account?.data?.default_device.description || t('Settings.IP Phone')
      sendNotification(
        t('Common.Warning'),
        t('Notification.physical_phone_error', { phone }),
      )
    }
  }

  const handleSocketReconnect = () => {
    window.location.reload()
  }

  // the newer release to download, found by the main process
  const showUpdateAppNotification = (update?: {
    version: string
    url: string
  }) => {
    setNotifications((p) => ({
      ...p,
      system: {
        update: {
          message: update?.url || 'https://nethserver.github.io/nethlink/',
          version: update?.version,
        },
      },
    }))
  }

  // a 403 may also be a missing permission: it is a revoked session only
  // when the user info is rejected too
  async function isSessionRevoked() {
    try {
      await NethVoiceAPI.User.me()
      return false
    } catch (e: any) {
      // the middleware rejects a revoked token with this message, other 403
      // come from the server behind it
      return (
        e?.status === 403 &&
        e?.response?.data?.message === SESSION_REJECTED_MESSAGE
      )
    }
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
            hasPermission(PERMISSION.PARKINGS)
              ? NethVoiceAPI.AstProxy.getParkings().then(onParkingsUpdate)
              : [],
          ],
          NethVoiceAPI.Phonebook.getSpeeddials().then(saveSpeeddials),
        ])
        Log.debug(results)
        const firstError = results.find((e) => e)
        if (firstError) {
          throw firstError
        }
        debouncer(
          'loadData',
          () => {
            isFetching.current = false
          },
          2000,
        )
      } catch (e: any) {
        Log.warning(e)
        if (e['status'] === 401) {
          Log.error(e)
          window.electron.send(IPC_EVENTS.RESUME)
        } else if (e['status'] === 403 && (await isSessionRevoked())) {
          // e.g. the password was changed: the user must sign in again
          Log.info('session revoked by the server, logout')
          window.api.logout()
          return
        }
        isFetching.current = false
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
    <div className='h-screen w-screen'>
      <div className='absolute flex h-full w-full flex-col items-center justify-end text-sm'>
        <div className='flex h-full w-full flex-col items-center justify-between'>
          {!connection && (
            <ConnectionBanner onRetry={handleRefreshConnection} />
          )}
          <div className='relative z-10 flex h-full min-h-0 w-full flex-row bg-bgLight dark:bg-bgDark'>
            <div className='flex h-full w-full min-w-0 flex-col gap-3'>
              <Navbar onClickAccount={() => updateAccountData()} />
              <NethLinkModules />
            </div>
            <Sidebar onChangeMenu={() => loadData()} />
          </div>
        </div>
      </div>
    </div>
  )
}
