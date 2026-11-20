import { useLoginPageData, useSharedState } from '@renderer/store'
import { Account } from '@shared/types'
import { t } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCirclePlus as AddAccountIcon } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@renderer/components/Nethesis'
import { DisplayedAccountLogin } from './DisplayedAccountLogin'
import { NEW_ACCOUNT } from '@shared/constants'

export const AvailableAccountList = ({
  handleDeleteAccount,
}: {
  handleDeleteAccount: (a: Account) => void
}) => {
  const [auth] = useSharedState('auth')
  const [, setSelectedAccount] = useLoginPageData('selectedAccount')
  const handleSelectAccount = (account) => {
    setSelectedAccount(account)
  }

  return (
    <div className='mt-6 w-full'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-xl font-medium text-titleLight dark:text-titleDark'>
          {t('Login.Choose an account')}
        </h1>
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          {t('Login.Account List description')}
        </p>
      </div>
      <div className='mt-6 flex max-h-60 flex-col gap-1 overflow-y-auto'>
        {Object.values(auth!.availableAccounts)!.map((account, idx) => {
          return (
            <DisplayedAccountLogin
              key={idx}
              account={account}
              imageSrc={account.data?.settings.avatar}
              handleClick={() => handleSelectAccount(account)}
              handleDeleteClick={() => handleDeleteAccount(account)}
            />
          )
        })}
      </div>
      <div className='my-4 flex items-center gap-4'>
        <div className='flex-grow border-b border-borderLight dark:border-borderDark' />
        <span className='text-sm text-gray-600 dark:text-gray-400'>
          {t('Common.or')}
        </span>
        <div className='flex-grow border-b border-borderLight dark:border-borderDark' />
      </div>
      <Button
        variant='tertiary'
        className='gap-2'
        onClick={() => handleSelectAccount(NEW_ACCOUNT)}
      >
        <FontAwesomeIcon
          icon={AddAccountIcon}
          className='size-4'
          aria-hidden='true'
        />
        {t('Login.Use Another Account')}
      </Button>
    </div>
  )
}
