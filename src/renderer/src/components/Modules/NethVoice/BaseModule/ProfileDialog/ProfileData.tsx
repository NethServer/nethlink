import { useSharedState } from '@renderer/store'
import { isDev } from '@shared/utils/utils'
import { t } from 'i18next'
import { truncate } from 'lodash'

export const ProfileData = () => {
  const [account] = useSharedState('account')

  if (!account) return <>{t('Common.Unknown')}</>
  return (
    <div className='flex min-h-16 w-full flex-col justify-center gap-0.5 px-4 py-3'>
      <p className='text-xs leading-4 text-gray-600 dark:text-gray-400'>
        {t('TopBar.Signed in as')}
      </p>
      <div className='flex flex-row items-center justify-between gap-3'>
        <p className='truncate text-sm font-medium leading-5 text-titleLight dark:text-titleDark'>
          {truncate(account.data?.name, { length: 20 })}
        </p>
        <p className='shrink-0 text-sm leading-5 text-gray-600 dark:text-gray-400'>
          {account.data?.endpoints.mainextension[0].id}
        </p>
        {isDev() && (
          <p className='absolute right-0 top-0 text-xs text-gray-600 dark:text-gray-400'>
            [{account.data?.default_device.type}]
          </p>
        )}
      </div>
    </div>
  )
}
