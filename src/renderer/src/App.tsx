import { Routes, Route, Outlet, HashRouter } from 'react-router-dom'
import { useInitialize } from '@/hooks/useInitialize'
import { LoginPage, NethConnectorPage, PhoneIslandPage, SettingsPage } from '@/pages'

function Layout() {
  return (
    <div>
      <Outlet />
    </div>
  )
}

function RoutesWrapper() {
  useInitialize(() => {
    console.log(location.hash)
  })

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="nethconnectorpage" element={<NethConnectorPage />} />
        <Route path="splahscreenpage" element={<SettingsPage />} />
        <Route path="loginpage" element={<LoginPage />} />
        <Route path="settingspage" element={<SettingsPage />} />
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
