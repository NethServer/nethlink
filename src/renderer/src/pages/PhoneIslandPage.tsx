import { PhoneIsland } from '@nethesis/phone-island'
import { eventDispatch } from '@renderer/hooks/eventDispatch'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { getI18nLoadPath } from '@renderer/lib/i18n'
import { useStoreState } from '@renderer/store'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS, PHONE_ISLAND_RESIZE } from '@shared/constants'
import { Account, CallData, Extension, OperatorsType, PhoneIslandConfig, Size } from '@shared/types'
import { log } from '@shared/utils/logger'
import { isDev } from '@shared/utils/utils'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { differenceWith, forEach, isEqual } from 'lodash'
import { sendNotification } from '@renderer/utils'
import i18next, { t } from 'i18next'
import { formatDistance } from 'date-fns'
import { format, utcToZonedTime } from 'date-fns-tz'
import { getTimeDifference } from '@renderer/lib/dateTime'
import { enGB, it } from 'date-fns/locale'
import { useRefStat as useRefState } from '@renderer/hooks/useRefState'

export function PhoneIslandPage() {
  const [account] = useStoreState<Account | undefined>('account')
  const [operators] = useStoreState<OperatorsType | undefined>('operators')

  const [lastCalls, setLastCalls] = useRefState<CallData[]>(useStoreState<CallData[]>('lastCalls'))
  const [missedCalls, setMissedCalls] = useRefState<CallData[]>(useStoreState<CallData[]>('missedCalls'))

  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  const [dataConfig, setDataConfig] = useState<string | undefined>(undefined)
  const [deviceInformationObject, setDeviceInformationObject] = useState<Extension | undefined>(undefined)

  const isDataConfigCreated = useRef<boolean>(false)
  const phoneIslandTokenLoginResponse = useRef<string>()
  const loadPath = useRef<string | undefined>(undefined)
  const phoneIslandContainer = useRef<HTMLDivElement | null>(null)

  const {
    onMainPresence,
    onQueueUpdate,
    saveLastCalls
  } = usePhoneIslandEventHandler()

  const isOnCall = useRef<boolean>(false)
  const isExpanded = useRef<boolean>(true)
  const lastResizeEvent = useRef<PHONE_ISLAND_EVENTS>()
  const isMinimized = useRef<boolean>(false)
  const isDisconnected = useRef<boolean>(false)

  const gestLastCalls = (newLastCalls: {
    count: number, rows: CallData[]
  }) => {
    const diff = differenceWith(newLastCalls.rows, lastCalls.current || [], (a, b) => a.uniqueid === b.uniqueid)
    const _missedCalls: CallData[] = [
      ...(missedCalls.current || [])
    ]
    let missed: CallData[] = []
    if (diff.length > 0) {
      diff.forEach((c) => {
        if (c.direction === 'in' && c.disposition === 'NO ANSWER') {
          _missedCalls.push(c)
          const differenceBetweenTimezone = diffValueConversation(getTimeDifference(account!, false))
          const timeDiff = format(utcToZonedTime(c.time! * 1000, differenceBetweenTimezone), 'HH:mm')
          sendNotification(t('Notification.lost_call_title', { user: c.cnam || c.ccompany || c.src || t('Common.Unknown') }), t('Notification.lost_call_body', { number: c.src, datetime: timeDiff }))
        }
      })

      setMissedCalls((p) => {
        const pmap = p?.map((c) => c.uniqueid) || []
        missed = [
          ...(p || []),
          ..._missedCalls.filter((c) => !pmap.includes(c.uniqueid))
        ]
        return missed
      })
    }
    setLastCalls(newLastCalls.rows)
  }

  useInitialize(() => {
    loadPath.current = getI18nLoadPath()
    window.electron.receive(IPC_EVENTS.LOGOUT, logout)

    window.electron.receive(IPC_EVENTS.START_CALL, (number: number | string) => {
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-start'], {
        number
      })
    })

    window.electron.receive(IPC_EVENTS.RECONNECT_PHONE_ISLAND, () => {
      logout()
    })

    Object.keys(PHONE_ISLAND_EVENTS).forEach((event) => {
      window.addEventListener(event, (...data) => {
        const customEvent = data[0]
        const detail = customEvent['detail']
        switch (event) {
          case PHONE_ISLAND_EVENTS['phone-island-default-device-changed']:
            log('phone-island-default-device-changed', detail)
            break
          case PHONE_ISLAND_EVENTS['phone-island-user-already-login']:
            window.api.logout()
            break
          case PHONE_ISLAND_EVENTS['phone-island-main-presence']:
            onMainPresence(detail)
            break
          case PHONE_ISLAND_EVENTS['phone-island-queue-update']:
            onQueueUpdate(detail)
            break
          case PHONE_ISLAND_EVENTS['phone-island-call-ringing']:
            window.api.showPhoneIsland()
            break
          case PHONE_ISLAND_EVENTS['phone-island-call-ended']:
            NethVoiceAPI.HistoryCall.interval().then((newLastCalls: {
              count: number, rows: CallData[]
            }) => {
              gestLastCalls(newLastCalls)
            })
          case PHONE_ISLAND_EVENTS['phone-island-call-parked']:
          case PHONE_ISLAND_EVENTS['phone-island-call-transfered']:
          case PHONE_ISLAND_EVENTS['phone-island-socket-disconnected']:
            window.api.hidePhoneIsland()
            isOnCall.current = false
            break
          case PHONE_ISLAND_EVENTS['phone-island-server-disconnected']:
          case PHONE_ISLAND_EVENTS['phone-island-socket-disconnected']:
            isDisconnected.current = true
            break
          case PHONE_ISLAND_EVENTS['phone-island-server-reloaded']:
          case PHONE_ISLAND_EVENTS['phone-island-socket-connected']:
            isDisconnected.current = false
            break
          case PHONE_ISLAND_EVENTS['phone-island-expanded']:
            isMinimized.current = false
            if (lastResizeEvent.current) {
              const previouEventSize = getSizeFromResizeEvent(lastResizeEvent.current)
              if (previouEventSize)
                window.api.resizePhoneIsland(previouEventSize.w, previouEventSize.h)
            }
            break
          case PHONE_ISLAND_EVENTS['phone-island-compressed']:
            isMinimized.current = true
            if (lastResizeEvent.current) {
              const previouEventSize = getSizeFromResizeEvent(lastResizeEvent.current)
              if (previouEventSize)
                window.api.resizePhoneIsland(previouEventSize.w, previouEventSize.h)
            }
            break
        }
        if (PHONE_ISLAND_RESIZE.has(event)) {
          switch (event) {
            case PHONE_ISLAND_EVENTS['phone-island-call-actions-opened']:
              isExpanded.current = false
              break
            case PHONE_ISLAND_EVENTS['phone-island-call-actions-closed']:
              isExpanded.current = true
              break
            case PHONE_ISLAND_EVENTS['phone-island-call-keypad-opened']:
              phoneIslandContainer.current?.children[1].setAttribute('style', 'padding-top: 40px')
              break
            case PHONE_ISLAND_EVENTS['phone-island-call-transfer-opened']:
              phoneIslandContainer.current?.children[1].setAttribute('style', 'padding-top: 40px')
              break
            case PHONE_ISLAND_EVENTS['phone-island-call-transfer-opened']:
              phoneIslandContainer.current?.children[1].setAttribute('style', 'padding-top: 40px')
              break
            default:
              phoneIslandContainer.current?.children[1].setAttribute('style', '')
              break
          }
          if (event === PHONE_ISLAND_EVENTS['phone-island-call-ringing']) {
            if (!isOnCall.current) {
              isOnCall.current = true
            } else {
              return
            }
          }
          const size = getSizeFromResizeEvent(event)!
          window.api.resizePhoneIsland(size.w, size.h)
        }
      })
    })
  })

  const diffValueConversation = (diffValueOriginal: any) => {
    // determine the sign
    const sign = diffValueOriginal >= 0 ? '+' : '-'

    // convert hours to string and pad with leading zeros if necessary
    const hours = Math.abs(diffValueOriginal).toString().padStart(2, '0')

    // minutes are always '00'
    const minutes = '00'
    return `${sign}${hours}${minutes}`
  }

  const getLocalTimezoneOffset = () => {
    let localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const now = new Date()
    const offset = format(now, 'xx', { timeZone: localTimezone })
    return offset
  }

  function getSizeFromResizeEvent(event: string): Size | undefined {
    const resizeEvent = PHONE_ISLAND_RESIZE.get(event)
    if (resizeEvent) {
      if (event !== PHONE_ISLAND_EVENTS['phone-island-compressed'])
        lastResizeEvent.current = event as PHONE_ISLAND_EVENTS
      const size = resizeEvent(isExpanded.current, isMinimized.current, isDisconnected.current)
      return size
    }
    return undefined
  }

  const createDataConfig = async () => {
    if (account) {
      try {
        phoneIslandTokenLoginResponse.current = (await NethVoiceAPI.Authentication.phoneIslandTokenLogin()).token
        const deviceInformationObject = account.data!.endpoints.extension.find((e) => e.type === 'nethlink')
        setDeviceInformationObject(deviceInformationObject)
      } catch (e) {
        log(e)
        isDataConfigCreated.current = false
      }
    }
  }

  useEffect(() => {
    if (account) {
      if (!isDataConfigCreated.current) {
        isDataConfigCreated.current = true
        createDataConfig()
      }

    } else {
      logout()
    }
  }, [account?.username, isDataConfigCreated.current])

  useEffect(() => {
    if (deviceInformationObject && account && phoneIslandTokenLoginResponse.current) {
      const hostname = account!.host
      const config: PhoneIslandConfig = {
        hostname,
        username: account.username,
        authToken: phoneIslandTokenLoginResponse.current,
        sipExten: deviceInformationObject.id,
        sipSecret: deviceInformationObject.secret,
        sipHost: account.sipHost || '',
        sipPort: account.sipPort || ''
      }
      const dataConfig = btoa(
        `${config.hostname}:${config.username}:${config.authToken}:${config.sipExten}:${config.sipSecret}:${config.sipHost}:${config.sipPort}`
      )
      setDataConfig(dataConfig)
    }
  }, [deviceInformationObject, account?.username])

  function logout() {
    isDataConfigCreated.current = false
    setDataConfig(undefined)
    eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-end'])
    if (deviceInformationObject)
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-detach'], {
        deviceInformationObject
      })
  }

  return (
    <div
      ref={phoneIslandContainer}
      className={`absolute top-0 left-0 h-[100vh] w-[100vw] z-[9999] ${isDev() ? 'bg-red-700' : ''}`}
    >
      <div className="absolute h-[100vh] w-[100vw]  radius-md backdrop-hue-rotate-90"></div>
      {account && <PhoneIslandContainer dataConfig={dataConfig} i18nLoadPath={loadPath.current} deviceInformationObject={deviceInformationObject} />}
    </div>
  )
}

const PhoneIslandContainer = ({ dataConfig, deviceInformationObject, i18nLoadPath }) => {
  const [account] = useStoreState<Account>('account')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  useEffect(() => {
    updateAccountInfo()
  }, [dataConfig])

  const updateAccountInfo = async () => {
    if (account!.data!.default_device.type !== 'nethlink' && deviceInformationObject) {
      try {
        await NethVoiceAPI.User.default_device(deviceInformationObject)
        eventDispatch(PHONE_ISLAND_EVENTS['phone-island-default-device-change'], { deviceInformationObject })
      } catch (err) {
        log(err)
      }
    }
  }

  const PhoneIslandCompoent = useMemo(() => {
    return dataConfig && <PhoneIsland dataConfig={dataConfig} i18nLoadPath={i18nLoadPath} uaType='mobile' />
  }, [account?.username, dataConfig])

  return PhoneIslandCompoent
}
