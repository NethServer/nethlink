import NethLinkLogoSimple from '../../../../assets/LogoBlueSimple.svg'
import NethLinkLogoSimpleDark from '../../../../assets/LogoBlueSimpleDark.svg'
import { t } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare as DownloadIcon } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@renderer/components/Nethesis'
import { useSharedState } from '@renderer/store'
import { usePageCtx } from '@renderer/contexts/pageContext'
import { Scrollable } from '@renderer/components/Scrollable'
import { ModuleTitle } from '@renderer/components/ModuleTitle'
import { parseThemeToClassName } from '@renderer/utils'

export interface AboutBoxProps { }

export function AboutModule({ }: AboutBoxProps) {
  const page = usePageCtx()
  const [theme] = useSharedState('theme')
  const [notifications] = useSharedState('notifications')

  // Donwload NethLink release page
  const releasePage = 'https://nethserver.github.io/nethlink/'

  const onDownloadButtonClick = () => {
    window.api.openExternalPage(releasePage)
  }

  const openNethesisPage = () => {
    window.api.openExternalPage('https://www.nethesis.it/')
  }

  return (
    <>
      <ModuleTitle title={t('About.title')} />
      <Scrollable>
        <div className="flex flex-col w-full items-center px-4 text-bgDark dark:text-bgLight mb-1">
          <div className="mt-6 mb-4 flex flex-col items-center gap-2">
            <img
              src={
                parseThemeToClassName(theme) === 'dark'
                  ? NethLinkLogoSimpleDark
                  : NethLinkLogoSimple
              }
              className="h-10 overflow-hidden object-cover place-items-start"
            ></img>
            <div className="font-medium">
              NethLink by{' '}
              <span
                className="text-textBlueLight dark:text-textBlueDark cursor-pointer hover:underline"
                onClick={openNethesisPage}
              >
                Nethesis
              </span>
            </div>
          </div>
          <div className="text-gray-400 mb-2">
            {t('About.current_version', { version: window.api.appVersion })}
          </div>
          {!!notifications?.system?.update && (
            <div className="mt-6 flex flex-col gap-2 items-center">
              <span className="font-medium text-[12px] leading-[18px]">
                {t('About.update_available')}
              </span>
              <Button variant="white" onClick={onDownloadButtonClick}>
                <div className="flex flex-row items-center gap-4">
                  <FontAwesomeIcon size="1x" icon={DownloadIcon} className="text-[16px]" />
                  <span className="font-medium text-sm">{t('About.download')}</span>
                </div>
              </Button>
            </div>
          )}
        </div>
      </Scrollable>
    </>
  )
}
