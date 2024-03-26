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
import { useEffect } from 'react'
import { useLocalStoreState } from './hooks/useLocalStoreState'
import { PageType } from '@shared/types'
import { delay } from '@shared/utils/utils'
import i18next from 'i18next'

function Layout({ isDev }: { isDev: boolean }) {

  function openDevTools() {
    let hash = window.location.hash.split('#/')
    if (hash.length === 1) {
      hash = window.location.hash.split('#')
    }
    const page = hash[1].split('?')[0].split('/')[0]
    console.log('open dev tools', page)
    window.api.openDevTool(page)
  }

  useEffect(() => {
    openDevTools()
  }, [])


  return (
    <div>
      {
        isDev && <div className='absolute bottom-0 left-0 z-[10000]'><button onClick={openDevTools} id='openDevToolButton' className='bg-white p-1'>dev</button></div>
      }
      <Outlet />
    </div>
  )
}

export default function App() {

  const [page, setPage] = useLocalStoreState<PageType>('page')

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
  })

  const loader = async () => {
    let time = 0
    //attendo che la lingua venga caricata oppure 1 secondo
    while (time < 10 && !i18next.isInitialized) {
      await delay(100)
      time++
    }
    const devices = await navigator.mediaDevices.enumerateDevices()
    //getUserMedia({ audio: {}, video: {} });
    log(devices)
    return null
  }

  const router = createHashRouter([
    {
      path: '/',
      element: <Layout isDev={page?.props?.isDev || false} />,
      loader: loader,
      children: [
        {
          path: 'splashscreenpage',
          element: <SplashScreenPage />
        },
        {
          path: 'loginpage',
          element: <LoginPage />
        },
        {
          path: 'phoneislandpage',
          element: <PhoneIslandPage />
        },
        {
          path: 'nethconnectorpage',
          element: <NethLinkPage />
        }
      ]
    }
  ])

  return (
    <RouterProvider router={router} />
  )
}
