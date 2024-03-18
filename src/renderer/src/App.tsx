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
import { is } from '@electron-toolkit/utils'

function Layout({ isDev }: { isDev: boolean }) {

  function openDevTools() {
    let hash = window.location.hash.split('#/')
    if (hash.length === 1) {
      hash = window.location.hash.split('#')
    }
    const page = hash[1].split('/')[0]
    window.api.openDevTool(page)
  }

  return (
    <div>
      {
        isDev && <button onClick={openDevTools} className='absolute bottom-0 left-0 bg-white p-1 z-[1000]'>devtool</button>
      }
      <Outlet />
    </div>
  )
}

function RoutesWrapper() {

  useInitialize(() => {
    log(location.hash)
    log(location.search)
    loadI18n()
  })
  const query = location.search || location.hash
  const props = query.split('?')[1]?.split('&')?.reduce<any>((p, c) => {
    const [k, v] = c.split('=')
    return {
      ...p,
      [k]: v
    }
  }, {}) || {}


  return (
    <Routes>
      <Route path="/" element={<Layout isDev={props.isDev} />}>
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
