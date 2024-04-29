import { Account } from '@shared/types'
import classNames from 'classnames'
import { t } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser as DefaultAvatar } from '@fortawesome/free-solid-svg-icons'

type DisplayedAccountLoginProps = {
  account?: Account
  imageSrc?: string
  handleClick?: () => void
}

export function DisplayedAccountLogin({
  account,
  imageSrc,
  handleClick
}: DisplayedAccountLoginProps) {
  return (
    <div
      onClick={() => handleClick?.()}
      className={classNames(
        'w-full flex flex-row gap-7 items-center justify-start bg-transparent h-20 rounded-lg text-gray-900 dark:text-gray-50 cursor-pointer',
        handleClick ? 'hover:bg-gray-200 dark:hover:bg-gray-600' : ''
      )}
    >
      <div className="ml-5 w-12 h-12 rounded-full overflow-hidden">
        {imageSrc ? (
          <img src={imageSrc} />
        ) : (
          <FontAwesomeIcon
            icon={DefaultAvatar}
            className="text-[48px] dark:text-gray-50 text-gray-600"
          />
        )}
      </div>
      <p className="w-[325px] truncate">
        {account
          ? `${account.data?.name} (${account.data?.endpoints.mainextension[0].id})`
          : t('Login.Use Another Account')}
      </p>
    </div>
  )
}
