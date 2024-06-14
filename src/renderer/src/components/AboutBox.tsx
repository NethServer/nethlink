import { useSubscriber } from '@renderer/hooks/useSubscriber'
import NethLinkLogoSimple from '../assets/LogoBlueSimple.svg'
import { t } from 'i18next'
import { Notifications, PageType } from '@shared/types'
import { Button } from './Nethesis'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUpRightFromSquare as DownloadIcon,
} from '@fortawesome/free-solid-svg-icons'

export interface AboutBoxProps {

}

export function AboutBox({ }: AboutBoxProps) {
  const page = useSubscriber<PageType>('page')
  const notifications = useSubscriber<Notifications>('notifications')

  const onDownloadButtonClick = () => {
    window.api.openExternalPage(notifications.system.update.message)
  }

  return (
    <div className='flex flex-col w-full items-center px-4 text-bgDark dark:text-bgLight'>
      <div className='flex flex-row items-start w-full border-0 border-b-[1px] dark:border-borderDark border-borderLight'>
        <div>{t('About.title')}</div>
      </div>
      <div className='mt-8 mb-4 flex flex-col items-center gap-2'>
        <img src={NethLinkLogoSimple} className="h-10 overflow-hidden object-cover place-items-start"></img>
        <div className='font-medium'>NehLink by <span className='text-blue-500'>Nethesis</span></div>
      </div>
      <div className='text-gray-400'>{t('About.current_version', { version: page?.props.appVersion })}</div>
      {!!notifications?.system?.update && <div className='mt-8 flex flex-col gap-3 items-center'>
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
  )
}
