import { PhoneIsland } from '@nethesis/phone-island'
import { eventDispatch } from '@renderer/hooks/eventDispatch'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { getI18nLoadPath } from '@renderer/lib/i18n'
import { useStoreState } from '@renderer/store'
import { IPC_EVENTS, PERMISSION, PHONE_ISLAND_EVENTS, PHONE_ISLAND_RESIZE } from '@shared/constants'
import { Account, CallData, Extension, PhoneIslandConfig, PhoneIslandPageData, Size } from '@shared/types'
import { log } from '@shared/utils/logger'
import { delay, isDev } from '@shared/utils/utils'
import { useRefState } from '@renderer/hooks/useRefState'
import { useState, useRef, useEffect, useMemo } from 'react'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { differenceWith } from 'lodash'
import { sendNotification } from '@renderer/utils'
import { t } from 'i18next'
import { format, utcToZonedTime } from 'date-fns-tz'
import { getTimeDifference } from '@renderer/lib/dateTime'
import { enGB, it } from 'date-fns/locale'
import { ElectronDraggableWindow } from '@renderer/components/ElectronDraggableWindow'
import { useAccount } from '@renderer/hooks/useAccount'

export function PhoneIslandPage() {
  const [account] = useStoreState<Account | undefined>('account')

  const [lastCalls, setLastCalls] = useRefState<CallData[]>(useStoreState<CallData[]>('lastCalls'))
  const [missedCalls, setMissedCalls] = useRefState<CallData[]>(useStoreState<CallData[]>('missedCalls'))

  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  const [dataConfig, setDataConfig] = useState<string | undefined>(undefined)
  const [deviceInformationObject, setDeviceInformationObject] = useRefState<Extension | undefined>(useState<Extension | undefined>(undefined))

  const isDataConfigCreated = useRef<boolean>(false)
  const phoneIslandTokenLoginResponse = useRef<string>()
  const loadPath = useRef<string | undefined>(undefined)
  const phoneIslandContainer = useRef<HTMLDivElement | null>(null)
  const isOnLogout = useRef<boolean>(false)
  const listeners = useRef<{
    [key: string]: (...data: any) => Promise<void>
  }>({})

  const {
    onMainPresence,
    onQueueUpdate,
    onParkingsUpdate,
    saveLastCalls
  } = usePhoneIslandEventHandler()

  const isOnCall = useRef<boolean>(false)
  const lastResizeEvent = useRef<PHONE_ISLAND_EVENTS | undefined>(undefined)
  const phoneIslandState = useRef<PHONE_ISLAND_EVENTS | undefined>(undefined)
  const [phoneIslandPageData, setPhoneIslandPageData] = useRefState<PhoneIslandPageData>(useStoreState<PhoneIslandPageData>('phoneIslandPageData'))
  const { hasPermission } = useAccount()


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
    setPhoneIslandPageData(() => ({
      isExpanded: true,
      isMinimized: false,
      isDisconnected: false
    }))
    window.electron.receive(IPC_EVENTS.LOGOUT, logout)

    window.electron.receive(IPC_EVENTS.START_CALL, (number: string) => {
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-start'], {
        number
      })
    })

    window.electron.receive(IPC_EVENTS.RECONNECT_PHONE_ISLAND, () => {
      logout()
    })

    Object.keys(PHONE_ISLAND_EVENTS).forEach((event) => {
      listeners.current[event] = async (...data: any) => {
        log(event, data)
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
          case PHONE_ISLAND_EVENTS['phone-island-parking-update']:
            if (hasPermission(PERMISSION.PARKINGS)) {
              NethVoiceAPI.AstProxy.getParkings().then(onParkingsUpdate)
            }
            break;
          case PHONE_ISLAND_EVENTS['phone-island-call-transfer-successfully-popup-open']:
            sendNotification(t('Notification.call_transferred_title'), t('Notification.call_transferred_body'))
            break
          case PHONE_ISLAND_EVENTS['phone-island-call-ringing']:
            if (phoneIslandState.current !== event && !isOnCall.current) {
              phoneIslandState.current = event
              show()
            }
            break
          case PHONE_ISLAND_EVENTS['phone-island-server-disconnected']:
          case PHONE_ISLAND_EVENTS['phone-island-socket-disconnected']:
            setPhoneIslandPageData((p) => ({
              ...p,
              isDisconnected: true
            }))
            await dispatchAndWait(
              PHONE_ISLAND_EVENTS['phone-island-call-end'],
              PHONE_ISLAND_EVENTS['phone-island-call-ended'],
              {
                timeout: 2000
              })
            window.electron.send(IPC_EVENTS.UPDATE_CONNECTION_STATE, false);
            isOnCall.current = false
            break
          case PHONE_ISLAND_EVENTS['phone-island-call-ended']:
            NethVoiceAPI.HistoryCall.interval().then((newLastCalls: {
              count: number, rows: CallData[]
            }) => {
              gestLastCalls(newLastCalls)
            })
            lastResizeEvent.current = undefined
            phoneIslandState.current = PHONE_ISLAND_EVENTS['phone-island-call-end']
            // when blind transfer is not answered and then the call come back we need to ensure could also not answer [this is a workaroud because after the call-end we receive anoter call-ringing from the target of the call transfer]
            setTimeout(() => {
              isOnCall.current = false
            }, 250)
            break;
          case PHONE_ISLAND_EVENTS['phone-island-server-reloaded']:
          case PHONE_ISLAND_EVENTS['phone-island-socket-connected']:
            setPhoneIslandPageData((p) => ({
              ...p,
              isDisconnected: false
            }))
            if (!isOnCall.current) {
              window.api.hidePhoneIsland()
            }
            window.electron.send(IPC_EVENTS.UPDATE_CONNECTION_STATE, true);
            break
          case PHONE_ISLAND_EVENTS['phone-island-expanded']:
            setPhoneIslandPageData((p) => ({
              ...p,
              isMinimized: false
            }))
            if (lastResizeEvent.current) {
              const previouEventSize = getSizeFromResizeEvent(lastResizeEvent.current)
              if (previouEventSize)
                resize(previouEventSize)
            }
            break
          case PHONE_ISLAND_EVENTS['phone-island-compressed']:
            setPhoneIslandPageData((p) => ({
              ...p,
              isMinimized: true
            }))
            if (lastResizeEvent.current) {
              const previouEventSize = getSizeFromResizeEvent(lastResizeEvent.current)
              if (previouEventSize)
                resize(previouEventSize)
            }
            break
        }
        if (PHONE_ISLAND_RESIZE.has(event)) {
          switch (event) {
            case PHONE_ISLAND_EVENTS['phone-island-call-actions-opened']:
              setPhoneIslandPageData((p) => ({
                ...p,
                isExpanded: false
              }))
              break
            case PHONE_ISLAND_EVENTS['phone-island-call-actions-closed']:
              setPhoneIslandPageData((p) => ({
                ...p,
                isExpanded: true
              }))
              break
            case PHONE_ISLAND_EVENTS['phone-island-call-keypad-opened']:
            case PHONE_ISLAND_EVENTS['phone-island-call-transfer-opened']:
            case PHONE_ISLAND_EVENTS['phone-island-call-transfered']:
              phoneIslandContainer.current?.children[1].setAttribute('style', 'height: calc(100vh + 40px); position: relative;')
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
          log("RESIZE EVENT", event, size)
          resize(size)
        }
      }
      window.addEventListener(event, listeners.current[event])
    })
  })
  const show = () => {
    log(`SHOW PHONE ISLAND`)
    window.api.showPhoneIsland()
  }

  const resize = (size: Size) => {
    log(`RESIZE ${size.w}x${size.h} ${account?.username}`)
    window.api.resizePhoneIsland(size.w, size.h)
  }

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
    if (event === PHONE_ISLAND_EVENTS['phone-island-call-ended'] && phoneIslandState.current === PHONE_ISLAND_EVENTS['phone-island-call-ringing']) {
      event = phoneIslandState.current
    }
    const resizeEvent = PHONE_ISLAND_RESIZE.get(event)
    log('RESIZE FROM: ', { event, lastResizeEvent: lastResizeEvent.current, phoneIslandState: phoneIslandState.current })
    if (resizeEvent) {
      if (event !== PHONE_ISLAND_EVENTS['phone-island-compressed'])
        lastResizeEvent.current = event as PHONE_ISLAND_EVENTS
      const size = resizeEvent(
        phoneIslandPageData.current?.isExpanded ?? true,
        phoneIslandPageData.current?.isMinimized ?? false,
        phoneIslandPageData.current?.isDisconnected ?? false
      )
      log("RESIZE SIZE: ", size)
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
      if (!isDataConfigCreated.current && !isOnLogout.current) {
        isDataConfigCreated.current = true
        createDataConfig()
      }
    }
  }, [account?.username, isDataConfigCreated.current, isOnLogout.current])

  useEffect(() => {
    if (deviceInformationObject.current && account && phoneIslandTokenLoginResponse.current) {
      log('create data config')
      const hostname = account!.host
      const config: PhoneIslandConfig = {
        hostname,
        username: account.username,
        authToken: phoneIslandTokenLoginResponse.current,
        sipExten: deviceInformationObject.current.id,
        sipSecret: deviceInformationObject.current.secret,
        sipHost: account.sipHost || '',
        sipPort: account.sipPort || ''
      }
      const dataConfig = btoa(
        `${config.hostname}:${config.username}:${config.authToken}:${config.sipExten}:${config.sipSecret}:${config.sipHost}:${config.sipPort}`
      )
      setDataConfig(dataConfig)
    }
  }, [deviceInformationObject.current, account?.username])



  const dispatchAndWait = async (event: PHONE_ISLAND_EVENTS, awaitEvent: PHONE_ISLAND_EVENTS, options?: {
    data?: any,
    timeout?: number
  }) => {
    return new Promise<void>((resolve) => {
      const listener = () => {
        log('received', awaitEvent)
        timer && clearTimeout(timer)
        window.removeEventListener(awaitEvent, listener)
        resolve()
      }
      let timer = setTimeout(() => {
        log('timeout')
        window.removeEventListener(awaitEvent, listener)
        resolve()
      }, options?.timeout || 300)
      log('AddEventListener', awaitEvent)
      window.addEventListener(awaitEvent, listener)
      log('DispatchEvent', event)
      eventDispatch(event, options?.data)
    })
  }
  async function logout() {
    isOnLogout.current = true
    log('LOGOUT', deviceInformationObject.current)
    if (deviceInformationObject.current) {
      await dispatchAndWait(PHONE_ISLAND_EVENTS['phone-island-call-end'], PHONE_ISLAND_EVENTS['phone-island-call-ended'])
      log('completed phone-island-call-ended')
      await dispatchAndWait(PHONE_ISLAND_EVENTS['phone-island-detach'], PHONE_ISLAND_EVENTS['phone-island-detached'], {
        data: {
          deviceInformationObject: deviceInformationObject.current
        }
      })
      log('detached and LOGOUT_COMPLETED')
    }
    setDataConfig(undefined)
    isDataConfigCreated.current = false
    Object.keys(PHONE_ISLAND_EVENTS).forEach((event) => {
      window.removeEventListener(event, listeners.current[event])
    })
    await delay(250)
    window.electron.send(IPC_EVENTS.LOGOUT_COMPLETED)
    log('LOGOUT_COMPLETED')
  }

  return (
    <div
      ref={phoneIslandContainer}
      id={'phone-island-container'}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100vh',
        width: '100vw',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >

      <div style={{
        position: 'absolute',
        height: '100vh',
        width: '100vw',
        ...(isDev() ? {
          backgroundColor: '#058D1150',
        } : {}),

      }}
      ></div>
      <ElectronDraggableWindow>
        <div
          id="phone-island-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'start'
          }}>
          {account && <PhoneIslandContainer dataConfig={dataConfig} i18nLoadPath={loadPath.current} deviceInformationObject={deviceInformationObject.current} isDataConfigCreated={isDataConfigCreated.current} />}
        </div>
      </ElectronDraggableWindow>
    </div >
  )
}

const PhoneIslandContainer = ({ dataConfig, deviceInformationObject, isDataConfigCreated, i18nLoadPath }) => {
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

  const PhoneIslandComponent = useMemo(() => {
    log('update PhoneIsland', account?.username, isDataConfigCreated, dataConfig)
    return dataConfig && isDataConfigCreated && <PhoneIsland dataConfig={dataConfig} i18nLoadPath={i18nLoadPath} uaType='mobile' />
  }, [account?.username, dataConfig, isDataConfigCreated])

  return PhoneIslandComponent
}
