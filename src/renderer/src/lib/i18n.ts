import i18next, { NewableModule, Module, Newable } from 'i18next'
import Backend from 'i18next-electron-fs-backend'
import { initReactI18next } from 'react-i18next'
import { log } from '@shared/utils/logger'
import { join } from 'path-browserify'

const fallbackLng = ['en']

export const loadI18n = () => {
  if (typeof window === 'undefined') {
    return
  }
  const dir = __dirname.split('app.asar')[0]
  const loadPath = join(dir, '/app.asar/public/locales/{{lng}}/translations.json')
  const addPath = join(dir, '/app.asar/public/locales/{{lng}}/missing.json')
  log(loadPath, addPath)
  i18next
    .use(Backend)
    .use(initReactI18next)
    .init({
      backend: {
        debug: true,
        loadPath,
        addPath,
        contextBridgeApiKey: 'api',
        ipcRenderer: window.api.i18nextElectronBackend
      },
      fallbackLng,
      debug: true,
      saveMissing: true,
      saveMissingTo: 'current',
      interpolation: {
        escapeValue: false
      }
    })
}

window.api.i18nextElectronBackend.onLanguageChange((args) => {
  log('args.lng', args.lng)
  i18next.changeLanguage(args.lng, (error, _t) => {
    if (error) {
      console.error(error)
    }
  })
})

export default loadI18n
