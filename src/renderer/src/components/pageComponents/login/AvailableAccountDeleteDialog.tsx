import { Modal } from '@renderer/components'
import { Button } from '@renderer/components/Nethesis'
import { useSharedState } from '@renderer/store'
import { parseThemeToClassName, truncate } from '@renderer/utils'
import { Account } from '@shared/types'
import { t } from 'i18next'
import { createRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation as WarningIcon } from '@fortawesome/free-solid-svg-icons'
export const AvailableAccountDeleteDialog = ({
  isOpen,
  account,
  onDelete,
  close,
}: {
  isOpen: boolean
  account: Account | undefined
  onDelete: () => void
  close: () => void
}) => {
  const cancelDeleteButtonRef = createRef<HTMLButtonElement>()
  const [theme] = useSharedState('theme')

  const handleDeleteAccount = () => {
    onDelete()
    close()
  }

  const handleCancel = () => {
    close()
  }

  return (
    <Modal
      show={isOpen}
      focus={cancelDeleteButtonRef}
      onClose={() => close()}
      themeMode={parseThemeToClassName(theme)}
      className='font-Poppins'
    >
      <Modal.Content>
        <div className='mx-auto flex size-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 bg-bgAmberLight dark:bg-bgAmberDark '>
          <FontAwesomeIcon
            icon={WarningIcon}
            className='size-6 text-iconAmberLight dark:text-iconAmberDark'
            aria-hidden='true'
          />
        </div>
        <div className='mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left'>
          <h3 className='text-lg font-medium text-titleLight dark:text-titleDark'>
            {t('Login.Remove account')}
          </h3>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
            {t('Login.Remove account description', {
              username: truncate(account?.username || '', 30),
            })}
          </p>
        </div>
      </Modal.Content>
      <Modal.Actions>
        <Button variant='danger' onClick={handleDeleteAccount}>
          {t('Login.Remove')}
        </Button>
        <Button
          variant='ghost'
          onClick={handleCancel}
          ref={cancelDeleteButtonRef}
        >
          {t('Common.Cancel')}
        </Button>
      </Modal.Actions>
    </Modal>
  )
}
