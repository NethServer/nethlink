import { Routes, Route, Outlet, HashRouter } from 'react-router-dom'
import { useInitialize } from '@/hooks/useInitialize'
import { LoginPage, SettingsPage, TrayPage } from '@/pages'

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
        <Route path="traypage" element={<TrayPage />} />
        <Route path="splahscreenpage" element={<SettingsPage />} />
        <Route path="loginpage" element={<LoginPage />} />
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
