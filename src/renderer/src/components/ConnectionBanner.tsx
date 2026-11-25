import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { t } from 'i18next'

interface ConnectionBannerProps {
  onRetry: () => void
}

export const ConnectionBanner = ({ onRetry }: ConnectionBannerProps) => {
  return (
    <div
      role='alert'
      className='flex w-full shrink-0 flex-row items-center gap-2 border-b border-amber-400 bg-amber-100 px-4 py-1.5 dark:border-amber-500 dark:bg-amber-700'
    >
      <FontAwesomeIcon
        icon={faTriangleExclamation}
        className='h-4 w-4 shrink-0 text-amber-700 dark:text-amber-200'
        aria-hidden='true'
      />
      <p className='min-w-0 flex-1 text-sm font-medium text-amber-800 dark:text-amber-100'>
        {t('Common.Connection lost banner')}
      </p>
      <button
        type='button'
        onClick={onRetry}
        className='shrink-0 rounded text-sm font-medium text-amber-800 underline hover:text-amber-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-100 dark:hover:text-white'
      >
        {t('Common.Retry')}
      </button>
    </div>
  )
}
