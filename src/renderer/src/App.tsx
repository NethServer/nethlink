import { Outlet, RouterProvider, createHashRouter } from 'react-router-dom'
import { useInitialize } from '@/hooks/useInitialize'
import { LoginPage, PhoneIslandPage, SplashScreenPage, NethLinkPage } from '@/pages'
import { loadI18n } from './lib/i18n'
import { log } from '@shared/utils/logger'
import { useEffect, useState } from 'react'
import { useLocalStoreState } from './hooks/useLocalStoreState'
import { Account, AvailableThemes, PAGES, PageType } from '@shared/types'
import { delay } from '@shared/utils/utils'
import i18next from 'i18next'
import { DevToolsPage } from './pages/DevToolsPage'
import { getSystemTheme } from './utils'

function Layout({ theme }: { theme?: AvailableThemes }) {
  return (
    <div className={`${theme} font-Poppins`}>
      <Outlet />
    </div>
  )
}

export default function App() {
  const [page, setPage] = useLocalStoreState<PageType>('page')
  //Potrebbe non servire
  const [theme, setTheme] = useLocalStoreState<AvailableThemes>('theme')
  const [classNameTheme, setClassNameTheme] = useState<AvailableThemes>(getSystemTheme())
  const [account, setAccount, accountRef] = useLocalStoreState<Account>('user')

  useInitialize(() => {
    log('hash', location.hash)
    log('search', location.search)
    loadI18n()
    const query = location.search || location.hash
    const props =
      query
        .split('?')[1]
        ?.split('&')
        ?.reduce<any>((p, c) => {
          const [k, v] = c.split('=')
          return {
            ...p,
            [k]: v
          }
        }, {}) || {}

    setPage({
      query,
      props
    })

    window.api.onAccountChange(updateAccount)
    window.api.onSystemThemeChange(updateSystemTheme)
    window.api.onThemeChange(updateTheme)
  })

  useEffect(() => {
    setClassNameTheme((_) => {
      return theme === 'system' ? getSystemTheme() : theme || 'dark'
    })
  }, [theme])

  useEffect(() => {
    log('account changed', account)
    if (account) {
      updateTheme(account.theme)
    } else {
      setTheme(getSystemTheme())
    }
  }, [account])

  const updateTheme = (theme: AvailableThemes) => {
    log('FROM WINDOW', theme, accountRef.current)
    setTheme(theme)
    if (accountRef.current) accountRef.current!.theme = theme
  }

  const updateSystemTheme = (theme: AvailableThemes) => {
    log('FROM SYSTEM', theme, accountRef.current)
    if (accountRef.current?.theme === 'system') {
      setClassNameTheme(getSystemTheme())
    }
  }

  function updateAccount(account: Account | undefined) {
    log('account change', account?.theme)
    setAccount(account)
  }

  const loader = async () => {
    let time = 0
    //attendo che la lingua venga caricata oppure 1 secondo
    while (time < 10 && !i18next.isInitialized) {
      await delay(100)
      time++
    }
    //const devices = await navigator.mediaDevices.enumerateDevices()
    //getUserMedia({ audio: {}, video: {} });
    //log(devices)
    return null
  }

  const router = createHashRouter([
    {
      path: '/',
      element: <Layout theme={classNameTheme} />,
      loader: loader,
      children: [
        {
          path: PAGES.SPLASHSCREEN,
          element: <SplashScreenPage />
        },
        {
          path: PAGES.LOGIN,
          element: <LoginPage />
        },
        {
          path: PAGES.PHONEISLAND,
          element: <PhoneIslandPage />
        },
        {
          path: PAGES.NETHLINK,
          element: <NethLinkPage themeMode={classNameTheme} />
        },
        {
          path: PAGES.DEVTOOLS,
          element: <DevToolsPage />
        }
      ]
    }
  ])

  return <RouterProvider router={router} />
}
