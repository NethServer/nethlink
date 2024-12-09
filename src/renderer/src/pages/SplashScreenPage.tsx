import { useInitialize } from '@renderer/hooks/useInitialize'
import darkBackground from '../assets/splashScreenDarkBackground.svg'
import lightBackground from '../assets/splashScreenLightBackground.svg'
import darkHeader from '../assets/nethlinkDarkHeader.svg'
import lightHeader from '../assets/nethlinkLightHeader.svg'
import darkLogo from '../assets/nethvoiceDarkIcon.svg'
import lightLogo from '../assets/nethvoiceLightIcon.svg'
import { t } from 'i18next'
import { useState } from 'react'
import { useSharedState } from '@renderer/store'
import { IPC_EVENTS } from '@shared/constants'
import { ConnectionErrorDialog } from '@renderer/components'

export interface SplashScreenPageProps {
  themeMode: string
}

export function SplashScreenPage({ themeMode }: SplashScreenPageProps) {
  const [connection] = useSharedState('connection')
  const [isNoConnectionDialogOpen, setIsnoConnectionDialogOpen] = useState<boolean>(false)
  useInitialize(() => {
    window.electron.receive(IPC_EVENTS.SHOW_NO_CONNECTION, () => {
      setIsnoConnectionDialogOpen(true)
    })
  })

  function exitApp() {
    window.api.exitNethLink()
  }

  return (
    <div className="relative h-screen w-screen p-1 rounded-[10px]  overflow-hidden">
      <img
        src={themeMode === 'dark' ? darkBackground : lightBackground}
        draggable={false}
        className="absolute w-screen h-screen top-0 left-0 object-cover"
      />
      <div className="absolute top-0 left-0 w-screen h-screen">
        {isNoConnectionDialogOpen && !connection && (
          <ConnectionErrorDialog
            variant='splashscreen'
            onButtonClick={exitApp}
            buttonText={t('Common.Quit')}
          />
        )
        }
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
            v{window.api.appVersion}
          </p>
        </div>
      </div>
    </div >
  )
}
