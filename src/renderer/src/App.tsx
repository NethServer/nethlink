import { Outlet, RouterProvider, createHashRouter } from 'react-router-dom'
import { useInitialize } from '@/hooks/useInitialize'
import {
  LoginPage,
  PhoneIslandPage,
  SplashScreenPage,
  NethLinkPage
} from '@/pages'
import { loadI18n } from './lib/i18n'
import { log } from '@shared/utils/logger'
import { useEffect, useState } from 'react'
import { useLocalStoreState } from './hooks/useLocalStoreState'
import { Account, AvailableThemes, PAGES, PageType } from '@shared/types'
import { delay } from '@shared/utils/utils'
import i18next from 'i18next'
import { DevToolsPage } from './pages/DevToolsPage'

function Layout({ theme }: { theme: string }) {

  return (
    <div className={theme}>
      <Outlet />
    </div>
  )
}

export default function App() {

  const [page, setPage] = useLocalStoreState<PageType>('page')
  //Potrebbe non servire
  const [theme, setTheme] = useState<AvailableThemes>(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const [account, setAccount, accountRef] = useLocalStoreState<Account>('user')

  useInitialize(() => {
    log('hash', location.hash)
    log('search', location.search)
    loadI18n()
    const query = location.search || location.hash
    const props = query.split('?')[1]?.split('&')?.reduce<any>((p, c) => {
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
    window.api.onSystemThemeChange(updateTheme)
  })

  useEffect(() => {
    log('account changed', account)
    if (account) {
      if (account.theme === 'system') {
        setTheme(() => {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        })
      } else {
        setTheme(() => account.theme)
      }
    } else {
      setTheme(() => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      })
    }
  }, [account])

  const updateTheme = (theme: AvailableThemes) => {
    //log('FROM WINDOW', theme)
    if (account) {
      if (accountRef.current!.theme === 'system') {
        setTheme(() => theme)
      }
    } else {
      setTheme(() => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      })
    }
  }

  function updateAccount(account: Account | undefined) {
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
      element: <Layout theme={theme} />,
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
          element: <NethLinkPage />
        },
        {
          path: PAGES.DEVTOOLS,
          element: <DevToolsPage />
        }
      ]
    }
  ])

  return (
    <RouterProvider router={router} />
  )
}
