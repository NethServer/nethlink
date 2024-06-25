import { PhoneIsland } from '@nethesis/phone-island'
import { eventDispatch } from '@renderer/hooks/eventDispatch'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { getI18nLoadPath } from '@renderer/lib/i18n'
import { useStoreState } from '@renderer/store'
import { IPC_EVENTS, PHONE_ISLAND_EVENTS, PHONE_ISLAND_RESIZE } from '@shared/constants'
import { Account, Extension, OperatorData, OperatorsType, PhoneIslandConfig, Size } from '@shared/types'
import { log } from '@shared/utils/logger'
import { isDev } from '@shared/utils/utils'
import { useState, useRef, useEffect, useMemo } from 'react'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'

export function PhoneIslandPage() {
  const [account] = useStoreState<Account | undefined>('account')
  const [operators] = useStoreState<OperatorsType | undefined>('operators')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  const [dataConfig, setDataConfig] = useState<string | undefined>(undefined)
  const [deviceInformationObject, setDeviceInformationObject] = useState<Extension | undefined>(undefined)

  const isDataConfigCreated = useRef<boolean>(false)
  const phoneIslandTokenLoginResponse = useRef<string>()
  const loadPath = useRef<string | undefined>(undefined)
  const phoneIslandContainer = useRef<HTMLDivElement | null>(null)

  const {
    onMainPresence,
    onQueueUpdate
  } = usePhoneIslandEventHandler()

  const isOnCall = useRef<boolean>(false)
  const isExpanded = useRef<boolean>(true)
  const lastResizeEvent = useRef<PHONE_ISLAND_EVENTS>()
  const isMinimized = useRef<boolean>(false)
  const isDisconnected = useRef<boolean>(false)

  useInitialize(() => {
    loadPath.current = getI18nLoadPath()
    window.electron.receive(IPC_EVENTS.LOGOUT, logout)

    window.electron.receive(IPC_EVENTS.START_CALL, (number: number | string) => {
      log(account)
      eventDispatch(PHONE_ISLAND_EVENTS['phone-island-call-start'], {
        number
      })
    })

    window.electron.receive(IPC_EVENTS.RECONNECT_PHONE_ISLAND, () => {
      log('RECONNECT AFTER SUSPEND')
      logout()
    })

    Object.keys(PHONE_ISLAND_EVENTS).forEach((event) => {
      window.addEventListener(event, (...data) => {
        const customEvent = data[0]
        const detail = customEvent['detail']
        log(event, detail)
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
        log('phoneIslandTokenLoginResponse', phoneIslandTokenLoginResponse.current)
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
      log(dataConfig, config)
      setDataConfig(dataConfig)
    }
  }, [deviceInformationObject, account?.username])

  function logout() {
    log("LOGOUT")
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
    log("ACCOUNT", account)
  }

  const PhoneIslandCompoent = useMemo(() => {
    return dataConfig && <PhoneIsland dataConfig={dataConfig} i18nLoadPath={i18nLoadPath} uaType='mobile' />
  }, [account?.username, dataConfig])

  return PhoneIslandCompoent
}
