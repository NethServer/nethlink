import { Account } from '@shared/types'
import placeholder from '../assets/AvatarPlaceholderLoginPage.svg'
import classNames from 'classnames'
import { t } from 'i18next'

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
        'w-full flex flex-row gap-7 items-center justify-start bg-transparent h-20 rounded-lg text-gray-50',
        handleClick ? 'hover:bg-gray-700' : ''
      )}
    >
      <div className="ml-5 w-12 h-12 rounded-full overflow-hidden">
        <img src={imageSrc ?? placeholder}></img>
      </div>
      <p className="w-[325px] truncate">
        {account
          ? `${account.data?.name} (${account.data?.default_device.username})`
          : t('Login.Use Another Account')}
      </p>
    </div>
  )
}
