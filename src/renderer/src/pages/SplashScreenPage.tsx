import { useInitialize } from '@renderer/hooks/useInitialize'
import darkBackground from '../assets/splashScreenDarkBackground.svg'
import lightBackground from '../assets/splashScreenLightBackground.svg'
import darkHeader from '../assets/nethlinkDarkHeader.svg'
import lightHeader from '../assets/nethlinkLightHeader.svg'
import darkLogo from '../assets/nethvoiceDarkIcon.svg'
import lightLogo from '../assets/nethvoiceLightIcon.svg'
import { t } from 'i18next'
import { useSubscriber } from '@renderer/hooks/useSubscriber'
import { PageType } from '@shared/types'

export interface SplashScreenPageProps {
  themeMode: string
}

export function SplashScreenPage({ themeMode }: SplashScreenPageProps) {
  const page = useSubscriber<PageType>('page')
  useInitialize(() => {}, true)

  return (
    <div className="h-[100vh] w-[100vw] p-1 rounded-[10px]">
      <img
        src={themeMode === 'dark' ? darkBackground : lightBackground}
        draggable={false}
        className="absolute w-[100vw] h-[100vh] top-0 left-0"
      />
      <div className="absolute top-0 left-0 w-[100vw] h-[100vh]">
        <div className="h-full w-full flex flex-col items-center p-9">
          <img
            src={themeMode === 'dark' ? darkHeader : lightHeader}
            draggable="false"
            className="mt-8"
          ></img>
          <p className="dark:text-gray-300 text-gray-700 text-sm px-5 text-center mt-10">
            {t('SplashScreen.Description')}
          </p>
          <p className="dark:text-gray-300 text-gray-700 text-sm px-5 text-center mt-5">
            {t('SplashScreen.Initializing')}
          </p>

          <div className="grow flex items-end">
            <img
              src={themeMode === 'dark' ? darkLogo : lightLogo}
              className="w-12 h-12"
              draggable="false"
            ></img>
          </div>
          <p className="dark:text-gray-300 text-gray-700 text-sm px-5 text-center mt-5">
            v{page?.props.appVersion}
          </p>
        </div>
      </div>
    </div>
  )
}
