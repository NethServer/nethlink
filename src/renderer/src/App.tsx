import { Outlet, RouterProvider, createHashRouter } from 'react-router-dom'
import { useInitialize } from '@/hooks/useInitialize'
import { LoginPage, PhoneIslandPage, SplashScreenPage, NethLinkPage } from '@/pages'
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
  const { GET } = useNetwork()

  async function checkConnection() {
    const connected = await new Promise((resolve) => {
      GET('https://google.com', {} as any).then(() => {
        resolve(true)
      }).catch(() => {
        resolve(false)
      })
    })
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
