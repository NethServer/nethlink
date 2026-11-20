import { useInitialize } from '@renderer/hooks/useInitialize'
import darkBackground from '../assets/splashScreenDarkBackground.svg'
import lightBackground from '../assets/splashScreenLightBackground.svg'
import darkLogo from '../assets/nethvoiceDarkIcon.svg'
import lightLogo from '../assets/nethvoiceLightIcon.svg'
import { t } from 'i18next'
import { useState } from 'react'
import { IPC_EVENTS } from '@shared/constants'
import { ConnectionErrorDialog } from '@renderer/components'
import { SplashLogo } from '@renderer/components/SplashLogo'

export interface SplashScreenPageProps {
  themeMode: string
}

export function SplashScreenPage({ themeMode }: SplashScreenPageProps) {
  const [isNoConnectionDialogOpen, setIsnoConnectionDialogOpen] =
    useState<boolean>(false)
  useInitialize(() => {
    window.electron.receive(IPC_EVENTS.SHOW_NO_CONNECTION, () => {
      setIsnoConnectionDialogOpen(true)
    })
    window.electron.receive(IPC_EVENTS.HIDE_NO_CONNECTION, () => {
      setIsnoConnectionDialogOpen(false)
    })
  })

  function retryConnection() {
    setIsnoConnectionDialogOpen(false)
    window.electron.send(IPC_EVENTS.RETRY_CONNECTION)
  }

  return (
    <div className='relative h-screen w-screen overflow-hidden rounded-[10px] p-1'>
      <img
        src={themeMode === 'dark' ? darkBackground : lightBackground}
        draggable={false}
        className='absolute w-screen h-screen top-0 left-0 object-cover'
      />
      <div className='absolute top-0 left-0 w-screen h-screen'>
        {isNoConnectionDialogOpen && (
          <ConnectionErrorDialog
            variant='splashscreen'
            onButtonClick={retryConnection}
            buttonText={t('Common.Refresh')}
          />
        )}
        <div className='flex h-full w-full flex-col items-center p-9'>
          <SplashLogo className='mt-8 h-[46px] w-[250px]' />
          <p
            className='splash-fade-in mt-10 px-4 text-center text-sm leading-5 text-gray-700 dark:text-gray-200'
            style={{ animationDelay: '800ms' }}
          >
            {t('SplashScreen.Description')}
          </p>
          <div
            className='splash-fade-in mt-6 flex flex-col items-center gap-3'
            style={{ animationDelay: '1000ms' }}
          >
            <p className='px-4 text-center text-sm leading-5 text-gray-700 dark:text-gray-200'>
              {t('SplashScreen.Initializing')}
            </p>
            <div
              className='h-0.5 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'
              role='progressbar'
              aria-label={t('SplashScreen.Initializing') ?? undefined}
            >
              <div className='splash-progress-bar h-full w-2/5 rounded-full bg-blue-700 dark:bg-blue-500' />
            </div>
          </div>

          <div
            className='splash-fade-in flex grow flex-col items-center justify-end gap-4'
            style={{ animationDelay: '1000ms' }}
          >
            <img
              src={themeMode === 'dark' ? darkLogo : lightLogo}
              alt='NethVoice'
              className='size-12'
              draggable='false'
            />
            <p className='px-4 text-center text-sm leading-5 text-gray-700 dark:text-gray-200'>
              v{window.api.appVersion}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
