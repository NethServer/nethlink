import i18next, { NewableModule, Module, Newable } from 'i18next'
import Backend from 'i18next-electron-fs-backend'
import { initReactI18next } from 'react-i18next'
import { log } from '@shared/utils/logger'

const fallbackLng = ['en']

const options = {
  // User language is detected from the navigator
  order: ['navigator']
}
export const loadI18n = () => {
  if (typeof window === 'undefined') {
    return
  }
  const path = './public/locales/{{lng}}/translations.json'
  log(path)
  i18next
    .use(Backend)
    .use(initReactI18next)
    .init({
      backend: {
        loadPath: path,
        contextBridgeApiKey: 'api'
      },
      fallbackLng,
      debug: true,
      detection: options,
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
