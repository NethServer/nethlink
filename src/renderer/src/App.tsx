import { Outlet, RouterProvider, createHashRouter } from 'react-router-dom'
import { useInitialize } from '@/hooks/useInitialize'
import { LoginPage, PhoneIslandPage, SplashScreenPage, NethLinkPage, CommandBarPage } from '@/pages'
import { loadI18n } from './lib/i18n'
import { Log } from '@shared/utils/logger'
import { useEffect, useState } from 'react'
import { AvailableThemes, PAGES } from '@shared/types'
import { delay } from '@shared/utils/utils'
import i18next from 'i18next'
import { DevToolsPage } from './pages/DevToolsPage'
import { parseThemeToClassName } from './utils'
import { useRegisterStoreHook, useSharedState } from "@renderer/store";
import { PageContext, usePageCtx } from './contexts/pageContext'
import { IPC_EVENTS } from '@shared/constants'
import { useNetwork } from '@shared/useNetwork'
import './index.css'

const RequestStateComponent = () => {
  const pageData = usePageCtx()
  useRegisterStoreHook()
  const [theme,] = useSharedState('theme')
  const [account,] = useSharedState('account')
  const [connection,] = useSharedState('connection')
  const [hasWindowConfig, setHasWindowConfig] = useState<boolean>(false)
  const { HEAD } = useNetwork()

  const CONNECTIVITY_CHECK_ENDPOINTS = [
    'https://connectivitycheck.gstatic.com/generate_204', // Google's connectivity check
    'https://1.1.1.1/cdn-cgi/trace', // Cloudflare
    'https://cloudflare.com/cdn-cgi/trace' // Cloudflare alternative
  ]

  async function checkConnection() {
    // Quick check using browser's navigator.onLine
    if (!navigator.onLine) {
      Log.debug('check connection: navigator.onLine returned false')
      if (connection !== false) {
        window.electron.send(IPC_EVENTS.UPDATE_CONNECTION_STATE, false);
      }
      return
    }

    // Try connectivity check endpoints with fallbacks
    let connected = false
    for (const endpoint of CONNECTIVITY_CHECK_ENDPOINTS) {
      connected = await HEAD(endpoint, 3000)
      if (connected) {
        Log.debug('check connection: succeeded with', endpoint)
        break
      }
      Log.debug('check connection: failed with', endpoint, 'trying next...')
    }

    Log.debug('check connection', { connected, connection: connection })
    if (connected !== connection) {
      window.electron.send(IPC_EVENTS.UPDATE_CONNECTION_STATE, connected);
    }
  }

  useEffect(() => {
    if (account) {
      if (!window['CONFIG']) {
        // @ts-ignore (define in dts)
        window['CONFIG'] = {
          PRODUCT_NAME: 'NethLink',
          COMPANY_NAME: account.companyName,
          COMPANY_SUBNAME: 'CTI',
          COMPANY_URL: account.companyUrl,
          API_ENDPOINT: `${account.host}`,
          API_SCHEME: 'https://',
          WS_ENDPOINT: `wss://${account.host}/ws`,
          NUMERIC_TIMEZONE: account.numeric_timezone,
          SIP_HOST: account.sipHost,
          SIP_PORT: account.sipPort,
          TIMEZONE: account.timezone,
          VOICE_ENDPOINT: account.voiceEndpoint
        }
        Log.info('WINDOW CONFIG', pageData?.page, window['CONFIG'])
        setHasWindowConfig(true)
      }
    } else {
      window['CONFIG'] = undefined
      setHasWindowConfig(false)
    }
  }, [account?.username, pageData?.page])

  const loader = async () => {
    Log.debug('check i18n initialization')
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
          element: <NethLinkPage handleRefreshConnection={checkConnection} />
        },
        {
          path: PAGES.DEVTOOLS,
          element: <DevToolsPage handleRefreshConnection={checkConnection} />
        },
        {
          path: PAGES.COMMANDBAR,
          element: <CommandBarPage />
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
    if (page === PAGES.PHONEISLAND) {
      await import('@nethesis/phone-island/dist/index.css')
    }
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
    Log.debug('initialize i18n')
    loadI18n()
  })
  return (
    <PageContext>
      <RequestStateComponent />
    </PageContext>
  )
}
