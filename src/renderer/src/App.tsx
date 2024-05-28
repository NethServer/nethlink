import { Outlet, RouterProvider, createHashRouter } from 'react-router-dom'
import { useInitialize } from '@/hooks/useInitialize'
import { LoginPage, PhoneIslandPage, SplashScreenPage, NethLinkPage } from '@/pages'
import { loadI18n } from './lib/i18n'
import { log } from '@shared/utils/logger'
import { useEffect, useState } from 'react'
import { useLocalStoreState } from './hooks/useLocalStoreState'
import { Account, AvailableThemes, OperatorData, OperatorsType, PAGES, PageType } from '@shared/types'
import { delay } from '@shared/utils/utils'
import i18next from 'i18next'
import { DevToolsPage } from './pages/DevToolsPage'
import { getSystemTheme } from './utils'

function Layout({ theme }: { theme?: AvailableThemes }) {
  return (
    <div className={`${theme} font-Poppins`} id="phone-island-container">
      <Outlet />
    </div>
  )
}

export default function App() {
  const [page, setPage] = useLocalStoreState<PageType>('page')
  const [theme, setTheme] = useLocalStoreState<AvailableThemes>('theme')
  const [classNameTheme, setClassNameTheme] = useState<AvailableThemes>(getSystemTheme())
  const [account, setAccount, accountRef] = useLocalStoreState<Account>('user')
  const [operators, setOperators, operatorsRef] = useLocalStoreState<OperatorData>('operators')

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
    if (accountRef.current === undefined) {
      updateTheme(getSystemTheme())
    }
    if (accountRef.current?.theme === 'system') {
      setClassNameTheme(getSystemTheme())
    }
  }

  function updateAccount(account: Account | undefined) {
    log('account change', account?.theme)
    setAccount(account)
    if (account && account.data) {
      const _operators: OperatorsType = {
        ...(operatorsRef.current?.operators || {}),
        [account!.username]: {
          endpoints: account.data.endpoints,
          name: account.data.name,
          presence: account.data.presence,
          presenceOnBusy: account.data.presenceOnBusy,
          presenceOnUnavailable: account.data.presenceOnUnavailable,
          recallOnBusy: account.data.recallOnBusy,
          username: account.username,
          mainPresence: 'online'
        }
      }
      const op: OperatorData = {
        ...(operatorsRef.current || {}),
        operators: _operators,
        userEndpoints: _operators,
        extensions: {},
        avatars: {},
        groups: {}
      }
      setOperators(op)
    }
  }

  const loader = async () => {
    let time = 0
    //I wait for the language to load or 1 second
    while (time < 10 && !i18next.isInitialized) {
      await delay(100)
      time++
    }
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
          element: <SplashScreenPage themeMode={classNameTheme} />
        },
        {
          path: PAGES.LOGIN,
          element: <LoginPage themeMode={classNameTheme} />
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
