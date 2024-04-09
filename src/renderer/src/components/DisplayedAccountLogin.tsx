import { Account } from '@shared/types'
import classNames from 'classnames'
import { t } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser } from '@fortawesome/free-solid-svg-icons'

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
        'w-full flex flex-row gap-7 items-center justify-start bg-transparent h-20 rounded-lg text-gray-900 dark:text-gray-50 hover:text-gray-50 dark:hover:text-gray-50',
        handleClick ? 'hover:bg-gray-400 dark:hover:bg-gray-700' : ''
      )}
    >
      <div className="ml-5 w-12 h-12 rounded-full overflow-hidden">
        {imageSrc ? (
          <img src={imageSrc} />
        ) : (
          <FontAwesomeIcon icon={faCircleUser} className="text-[48px]" />
        )}
        {/* <img src={imageSrc ?? placeholder} className={imageSrc ? '' : 'mix-blend-difference dark:mix-blend-normal'}></img> */}
      </div>
      <p className="w-[325px] truncate ">
        {account
          ? `${account.data?.name} (${account.data?.default_device.username})`
          : t('Login.Use Another Account')}
      </p>
    </div>
  )
}
