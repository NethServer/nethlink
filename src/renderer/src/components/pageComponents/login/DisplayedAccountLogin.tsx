import { Account } from '@shared/types'
import { t } from 'i18next'
import { useId } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleMinus as RemoveIcon } from '@fortawesome/free-solid-svg-icons'
import { Avatar } from '../../Nethesis'
import { CustomThemedTooltip } from '../../Nethesis/CustomThemedTooltip'

type DisplayedAccountLoginProps = {
  account: Account
  imageSrc?: string
  // signs in with the account: the whole row is a button
  handleClick?: () => void
  // removes the account from the list
  handleDeleteClick?: () => void
}

export function DisplayedAccountLogin({
  account,
  imageSrc,
  handleClick,
  handleDeleteClick,
}: DisplayedAccountLoginProps) {
  const tooltipId = useId()
  const content = (
    <>
      <Avatar src={imageSrc} placeholderType='operator' size='base' />
      <div className='flex min-w-0 flex-1 flex-col text-left'>
        <span className='truncate text-sm font-medium text-titleLight dark:text-titleDark'>
          {account.data?.name}
        </span>
        <span className='truncate text-sm text-gray-600 dark:text-gray-400'>
          {t('Login.Account details', {
            extension: account.data?.endpoints.mainextension[0]?.id,
            host: account.host,
          })}
        </span>
      </div>
    </>
  )

  return (
    <div className='group flex items-center gap-1'>
      {handleClick ? (
        <button
          type='button'
          onClick={handleClick}
          className='flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 hover:bg-hoverLight focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:hover:bg-hoverDark dark:focus-visible:ring-primaryRingDark'
        >
          {content}
        </button>
      ) : (
        <div className='flex min-w-0 flex-1 items-center gap-3 px-3 py-2'>
          {content}
        </div>
      )}
      {handleDeleteClick && (
        <>
          <button
            type='button'
            aria-label={t('Login.Remove account') ?? undefined}
            data-tooltip-id={tooltipId}
            data-tooltip-content={t('Login.Remove account') ?? undefined}
            onClick={handleDeleteClick}
            className='shrink-0 rounded-md p-2 text-gray-600 hover:bg-hoverLight hover:text-textRedLight focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryRing dark:text-gray-400 dark:hover:bg-hoverDark dark:hover:text-textRedDark dark:focus-visible:ring-primaryRingDark'
          >
            <FontAwesomeIcon
              icon={RemoveIcon}
              className='size-4'
              aria-hidden='true'
            />
          </button>
          <CustomThemedTooltip id={tooltipId} place='left' />
        </>
      )}
    </div>
  )
}
