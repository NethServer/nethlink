import { Routes, Route, Outlet, HashRouter } from 'react-router-dom'
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
        isDev && <div className='absolute bottom-0 left-0  z-[10000]'><button onClick={openDevTools} id='openDevToolButton' className='bg-white p-1'>devtool</button></div>
      }
      <Outlet />
    </div>
  )
}

function RoutesWrapper() {
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



  return (
    <Routes>
      <Route path="/" element={<Layout isDev={page?.props?.isDev || false} />}>
        <Route path="splashscreenpage" element={<SplashScreenPage />} />
        <Route path="loginpage" element={<LoginPage />} />
        <Route path="phoneislandpage" element={<PhoneIslandPage />} />
        <Route path="nethconnectorpage" element={<NethLinkPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {


  return (
    <HashRouter>
      <RoutesWrapper />
    </HashRouter>
  )
}
