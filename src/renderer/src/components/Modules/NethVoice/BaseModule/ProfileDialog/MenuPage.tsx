import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft as ArrowIcon } from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import classNames from 'classnames'
import { menuRowClassName } from './MenuAction'

export const MenuPage = ({ goBack, title, children }) => {
  return (
    <div
      className={classNames(
        'flex h-full w-full flex-col overflow-hidden rounded-lg',
        'bg-bgInput dark:bg-bgInputDark',
      )}
    >
      <div className='py-1'>
        <button
          type='button'
          className={classNames(
            menuRowClassName,
            'font-medium text-textBlueLight dark:text-textBlueDark',
          )}
          onClick={goBack}
        >
          <FontAwesomeIcon
            icon={ArrowIcon}
            className='size-4 shrink-0 text-textBlueLight dark:text-textBlueDark'
            aria-hidden='true'
          />
          <span className='text-textBlueLight dark:text-textBlueDark'>
            {t('Login.Back')}
          </span>
        </button>
      </div>
      <h2 className='px-4 pb-1 pt-2 text-xs font-medium leading-4 text-gray-600 dark:text-gray-400'>
        {title}
      </h2>
      <div className='min-h-0 flex-1 overflow-y-auto pb-2'>{children}</div>
    </div>
  )
}
