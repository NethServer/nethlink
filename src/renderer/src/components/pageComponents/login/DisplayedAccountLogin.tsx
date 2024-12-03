import { Account } from '@shared/types'
import classNames from 'classnames'
import { t } from 'i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRemove as DeleteIcon } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from '../../Nethesis'
import { isDev } from '@shared/utils/utils'

type DisplayedAccountLoginProps = {
  account?: Account
  imageSrc?: string
  handleClick?: () => void
  handleDeleteClick?: () => void
}

export function DisplayedAccountLogin({
  account,
  imageSrc,
  handleClick,
  handleDeleteClick
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
      <div className='flex flex-row justify-between  items-center w-[325px]'>
        <p className="w-[300px] truncate">
          {account
            ? `${account.data?.name} (${account.data?.endpoints.mainextension[0].id})`
            : t('Login.Use Another Account')}
        </p>
        {
          handleDeleteClick && <FontAwesomeIcon className={classNames('w-[25px] p-2 text-titleLight dark:text-titleDark  hover:text-textBlueLight dark:hover:text-textBlueDark')} icon={DeleteIcon} onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDeleteClick()
          }} />
        }
      </div>
    </div>
  )
}
