import { Account } from '@shared/types'
import classNames from 'classnames'
import { t } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeadset as DefaultAvatar } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from '../../Nethesis'

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
        'w-full flex flex-row gap-7 items-center justify-start bg-transparent h-20 rounded-lg text-titleLight dark:text-titleDark cursor-pointer',
        handleClick ? 'hover:bg-hoverLight dark:hover:bg-hoverDark' : ''
      )}
    >
      <div className="ml-5 w-12 h-12 overflow-hidden">
        <Avatar
          src={imageSrc}
          placeholderType='operator'
          size='large'
        />
      </div>
      <p className="w-[325px] truncate">
        {account
          ? `${account.data?.name} (${account.data?.endpoints.mainextension[0].id})`
          : t('Login.Use Another Account')}
      </p>
    </div>
  )
}
