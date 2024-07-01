import NethLinkLogoSimple from '../../../assets/LogoBlueSimple.svg'
import { t } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUpRightFromSquare as DownloadIcon,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from '@renderer/components/Nethesis'
import { NotificationData } from '@shared/types'
import { useStoreState } from '@renderer/store'
import { usePageCtx } from '@renderer/contexts/pageContext'
import { Scrollable } from '@renderer/components/Scrollable'
import { ModuleTitle } from '@renderer/components/ModuleTitle'

export interface AboutBoxProps {

}

export function AboutModule({ }: AboutBoxProps) {
  const page = usePageCtx()
  const [notifications] = useStoreState<NotificationData>('notifications')

  const onDownloadButtonClick = () => {
    window.api.openExternalPage(notifications!.system.update.message)
  }

  const openNethesisPage = () => {
    window.api.openExternalPage('https://www.nethesis.it/')
  }

  return (
    <>
      <ModuleTitle
        title={t('About.title')}
      />
      <Scrollable>
        <div className='flex flex-col w-full items-center px-4 text-bgDark dark:text-bgLight'>
          <div className='mt-8 mb-4 flex flex-col items-center gap-2'>
            <img src={NethLinkLogoSimple} className="h-10 overflow-hidden object-cover place-items-start"></img>
            <div className='font-medium'>NethLink by <span className='text-blue-500 cursor-pointer' onClick={openNethesisPage}>Nethesis</span></div>
          </div>
          <div className='text-gray-400'>{t('About.current_version', { version: page?.props.appVersion })}</div>
          {
            !!notifications?.system?.update && <div className='mt-8 flex flex-col gap-3 items-center'>
              <div>{t('About.update_available')}</div>
              <Button
                variant='white'
                onClick={onDownloadButtonClick}
              >
                <div className='flex flex-row items-center gap-4'>
                  <FontAwesomeIcon size="1x" icon={DownloadIcon} className="text-[20px]" />
                  {t('About.download')}
                </div>
              </Button>
            </div>
          }
        </div>
      </Scrollable>
    </>
  )
}
