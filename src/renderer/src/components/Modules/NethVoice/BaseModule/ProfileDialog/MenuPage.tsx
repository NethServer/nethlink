import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft as ArrowIcon } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@renderer/components/Nethesis'
import { t } from 'i18next'
import classNames from 'classnames'
import { Scrollable } from '@renderer/components/Scrollable'

export const MenuPage = ({ goBack, title, children }) => {
  return (
    <div
      className={classNames(
        'w-[252px] h-[333px] overflow-hidden',
        'bg-bgInput dark:bg-bgInputDark w-full h-full',
        'rounded-lg border-0',
      )}
    >
      <div className='py-2'>
        <Button
          variant='ghost'
          className='flex gap-3 w-full rounded-none !justify-start'
          onClick={goBack}
        >
          <FontAwesomeIcon
            icon={ArrowIcon}
            className='h-5 w-5 dark:text-textBlueDark text-textBlueLight'
          />
          <p className='dark:text-textBlueDark text-textBlueLight font-medium'>
            {t('Login.Back')}
          </p>
        </Button>
      </div>
      <div>
        <p className='pt-2 px-4 dark:text-bgLight text-bgDark uppercase'>
          {title}
        </p>
        <Scrollable className='max-h-[237px] mb-4'>{children}</Scrollable>
      </div>
    </div>
  )
}
