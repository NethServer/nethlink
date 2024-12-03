import { Outlet, RouterProvider, createHashRouter } from 'react-router-dom'
import { useInitialize } from '@/hooks/useInitialize'
import { LoginPage, PhoneIslandPage, SplashScreenPage, NethLinkPage } from '@/pages'
import { loadI18n } from './lib/i18n'
import { log } from '@shared/utils/logger'
import { useEffect, useRef, useState } from 'react'
import { Account, AvailableThemes, PAGES } from '@shared/types'
import { delay } from '@shared/utils/utils'
import i18next from 'i18next'
import { DevToolsPage } from './pages/DevToolsPage'
import { getSystemTheme, parseThemeToClassName } from './utils'
import { useRegisterStoreHook, useStoreState } from "@renderer/store";
import { PageContext, PageCtx, usePageCtx } from './contexts/pageContext'
import { GIT_RELEASES_URL, IPC_EVENTS } from '@shared/constants'
import { useRefState } from './hooks/useRefState'
import { useNetwork } from '@shared/useNetwork'


const RequestStateComponent = () => {
  const pageData = usePageCtx()
  const isRequestInitialized = useRef(false)
  useRegisterStoreHook()
  const [theme,] = useStoreState<AvailableThemes>('theme')
  const [account,] = useStoreState<Account>('account')
  const [connection,] = useRefState(useStoreState<boolean>('connection'))
  const [hasWindowConfig, setHasWindowConfig] = useState<boolean>(false)
  const { GET } = useNetwork()
  useEffect(() => {
    if (!isRequestInitialized.current) {
      isRequestInitialized.current = true
      window.electron.send(IPC_EVENTS.REQUEST_SHARED_STATE);
    }
  }, [pageData?.page])

  async function checkConnection() {
    const connected = await new Promise((resolve) => {
      GET(GIT_RELEASES_URL).then(() => {
        resolve(true)
      }).catch(() => {
        resolve(false)
      })
    })
    log("checkConnection:", { connected, connection: connection.current })
    if (connected !== connection.current) {
      window.electron.send(IPC_EVENTS.UPDATE_CONNECTION_STATE, connected);
    }
  }

  useEffect(() => {
    if (account) {
      if (!window['CONFIG']) {
        // @ts-ignore (define in dts)
        window.CONFIG = {
          PRODUCT_NAME: 'NethLink',
          COMPANY_NAME: 'Nethesis',
          COMPANY_SUBNAME: 'CTI',
          COMPANY_URL: 'https://www.nethesis.it/',
          API_ENDPOINT: `${account.host}`,
          API_SCHEME: 'https://',
          WS_ENDPOINT: `wss://${account.host}/ws`,
          NUMERIC_TIMEZONE: account.numeric_timezone,
          SIP_HOST: account.sipHost,
          SIP_PORT: account.sipPort,
          TIMEZONE: account.timezone,
          VOICE_ENDPOINT: account.voiceEndpoint
        }
        log(window['CONFIG'])
        setHasWindowConfig(true)
      }
    } else {
      window['CONFIG'] = undefined
      setHasWindowConfig(false)
    }
  }, [account, pageData?.page])

  const loader = async () => {
    let time = 0
    //I wait for the language to load or 200 milliseconds
    while (time < 20 && !i18next.isInitialized) {
      await delay(10)
      time++
    }
    return null
  }

  const router = createHashRouter([
    {
      path: '/',
      element: <Layout theme={parseThemeToClassName(theme)} page={pageData?.page as PAGES} />,
      loader: loader,
      children: [
        {
          path: PAGES.SPLASHSCREEN,
          element: <SplashScreenPage themeMode={parseThemeToClassName(theme)} />
        },
        {
          path: PAGES.LOGIN,
          element: <LoginPage themeMode={parseThemeToClassName(theme)} handleRefreshConnection={checkConnection} />
        },
        {
          path: PAGES.PHONEISLAND,
          element: hasWindowConfig && <PhoneIslandPage />
        },
        {
          path: PAGES.NETHLINK,
          element: <NethLinkPage themeMode={parseThemeToClassName(theme)} handleRefreshConnection={checkConnection} />
        },
        {
          path: PAGES.DEVTOOLS,
          element: <DevToolsPage handleRefreshConnection={checkConnection} />
        }
      ]
    }
  ])

  return <RouterProvider router={router} />
}
const Layout = ({ theme, page }: { theme?: AvailableThemes, page?: PAGES }) => {

  const [isCSSLoaded, setIsCSSLoaded] = useState(false);
  useEffect(() => {
    if (page) {
      importStyle()
    }
  }, [page]);

  const importStyle = async () => {
    // Importing CSS dynamically when the page is not 'PHONEISLAND'
    if (page !== PAGES.PHONEISLAND) {
      await import('./tailwind.css')
    }
    await import('./index.css')
    setIsCSSLoaded(true);
  }

  if (!isCSSLoaded) {
    return <div></div>;
  }

  return (
    <>
      <div className={`${theme} font-Poppins`} id="app-container">
        <Outlet />
      </div>
    </>
  )
}

export default function App() {

  useInitialize(() => {
    loadI18n()
  })

  return (
    <PageContext>
      <RequestStateComponent />
    </PageContext>
  )
}
