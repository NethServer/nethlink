import { t } from 'i18next'
import { Trans } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare as DownloadIcon } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@renderer/components/Nethesis'
import { useSharedState } from '@renderer/store'
import { Scrollable } from '@renderer/components/Scrollable'
import { ModuleTitle } from '@renderer/components/ModuleTitle'
import { NethLinkMark } from '@renderer/components/SplashLogo'

export interface AboutBoxProps {}

export function AboutModule() {
  const [notifications] = useSharedState('notifications')
  const [account] = useSharedState('account')

  // the page of the newer release, or the download page of NethLink
  const update = notifications?.system?.update
  const onDownloadButtonClick = () => {
    window.api.openExternalPage(
      update?.message || 'https://nethserver.github.io/nethlink/',
    )
  }

  const openCompanyUrl = () => {
    if (account?.companyUrl) {
      window.api.openExternalPage(account.companyUrl)
    }
  }

  return (
    <>
      <ModuleTitle title={t('About.title')} />
      <Scrollable>
        <div className='mb-1 flex w-full flex-col items-center px-4 text-sm text-titleLight dark:text-titleDark'>
          <div className='mb-4 mt-6 flex flex-col items-center gap-2'>
            <NethLinkMark className='h-10 w-12' />
            <div className='font-medium'>
              <Trans
                i18nKey='About.NethLink by'
                values={{ company: account?.companyName }}
                components={{
                  company: (
                    <button
                      type='button'
                      className='rounded text-textBlueLight hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:text-textBlueDark dark:focus-visible:ring-primaryRingDark'
                      onClick={openCompanyUrl}
                    />
                  ),
                }}
              />
            </div>
          </div>
          <div className='mb-2 text-gray-600 dark:text-gray-400'>
            {t('About.current_version', { version: window.api.appVersion })}
          </div>
          {!!notifications?.system?.update && (
            <div className='mt-6 flex flex-col items-center gap-2'>
              <span className='text-xs font-medium'>
                {update?.version
                  ? t('About.Version available', { version: update.version })
                  : t('About.update_available')}
              </span>
              <Button
                variant='white'
                className='gap-2'
                onClick={onDownloadButtonClick}
              >
                <FontAwesomeIcon
                  icon={DownloadIcon}
                  className='size-4'
                  aria-hidden='true'
                />
                {t('About.Open download page')}
              </Button>
            </div>
          )}
        </div>
      </Scrollable>
    </>
  )
}
