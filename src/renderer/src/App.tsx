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

function Layout() {
  return (
    <div>
      <Outlet />
    </div>
  )
}

function RoutesWrapper() {
  useInitialize(() => {
    log(location.hash)
    loadI18n()
  })

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="nethconnectorpage" element={<NethLinkPage />} />
        <Route path="splahscreenpage" element={<SplashScreenPage />} />
        <Route path="loginpage" element={<LoginPage />} />
        <Route path="phoneislandpage" element={<PhoneIslandPage />} />
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
