import i18next from 'i18next'
import Backend from 'i18next-electron-fs-backend'
import { initReactI18next } from 'react-i18next'
import { log } from '@shared/utils/logger'
import { join } from 'path-browserify'

const fallbackLng = ['en']

const electronDetector: any = {
  type: 'languageDetector',
  async: true,
  init: Function.prototype,
  detect: () => {
    return new Promise((resolve) => {
      window.api.getLocale().then((locale) => {
        const locales = [...locale.filter((l) => !!l), ...fallbackLng]
        log(locales)
        resolve(locales)
      })
    })
  },
  cacheUserLanguage: Function.prototype
}

export const loadI18n = (initialize = true): string | undefined => {
  if (typeof window === 'undefined') {
    return
  }
  log('onload i18n')
  let dir = __dirname
  // if (__dirname.includes('app.asar')) loadPath = join(__dirname.split('app.asar')[0], 'app.asar', loadPath)
  if (__dirname.includes('electron.asar')) dir = './public'
  let loadPath = join(dir, 'locales/{{lng}}/translations.json')
  //loadPath = '.' + loadPath

  log(__dirname, dir, loadPath)

  const config: any = {
    backend: {
      debug: true,
      loadPath,
      contextBridgeApiKey: 'api'
    },
    react: {
      useSuspense: false
    },
    fallbackLng,
    debug: true,
    saveMissing: true,
    saveMissingTo: 'current'
  }
  log('FROM nethLink', config)
  if (initialize) i18next.use(Backend).use(electronDetector).use(initReactI18next).init(config)
  return loadPath
}

window.api.i18nextElectronBackend.onLanguageChange((args) => {
  log('args.lng', args.lng)
  i18next.changeLanguage(args.lng, (error, _t) => {
    if (error) {
      console.error(error)
    }
  })
})

export const useTranslation = () => i18next

export default loadI18n
