import i18next from 'i18next'
import Backend from 'i18next-electron-fs-backend'
import { initReactI18next } from 'react-i18next'
import { join } from 'path-browserify'
import { uniq } from 'lodash'

const fallbackLng = ['en']

const electronDetector: any = {
  type: 'languageDetector',
  async: true,
  init: Function.prototype,
  detect: () => {
    return new Promise((resolve) => {
      window.api.getLocale().then((locale) => {
        const locales = uniq([locale!.split('-')[0], ...fallbackLng])
        resolve(locales)
      }).catch(() => {
        resolve(fallbackLng)
      })
    })
  },
  cacheUserLanguage: Function.prototype
}

const convertPath = (filename): string => {
  let dir = __dirname
  if (__dirname.includes('electron.asar')) dir = './public'
  let loadPath = join(dir, `locales/{{lng}}/${filename}.json`)
  return loadPath
}

export const getI18nLoadPath = (): string => convertPath('translations')

export const getI18nAppPath = (): string => convertPath('missings')

export const loadI18n = () => {
  if (typeof window === 'undefined') {
    return
  }
  const loadPath = getI18nLoadPath()
  const appPath = getI18nAppPath()
  const config: any = {
    backend: {
      debug: true,
      loadPath,
      appPath,
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
  i18next.use(Backend).use(electronDetector).use(initReactI18next).init(config)
}

window.api.i18nextElectronBackend.onLanguageChange((args) => {
  i18next.changeLanguage(args.lng, (error, _t) => {
    if (error) {
      console.error(error)
    }
  })
})

export default loadI18n
