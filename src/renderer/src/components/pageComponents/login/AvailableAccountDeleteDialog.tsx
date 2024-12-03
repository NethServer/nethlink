import { Modal } from "@renderer/components"
import { Button } from "@renderer/components/Nethesis"
import { useStoreState } from "@renderer/store"
import { parseThemeToClassName, truncate } from "@renderer/utils"
import { Account, AvailableThemes } from "@shared/types"
import { t } from "i18next"
import { createRef } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faTriangleExclamation as WarningIcon
} from '@fortawesome/free-solid-svg-icons'
export const AvailableAccountDeleteDialog = ({
  isOpen,
  account,
  onDelete,
  close
}: {
  isOpen: boolean
  account: Account | undefined,
  onDelete: () => void
  close: () => void
}) => {

  const cancelDeleteButtonRef = createRef<HTMLButtonElement>()
  const [theme] = useStoreState<AvailableThemes>('theme')

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
      className="font-Poppins w-[100px]"
    >
      <Modal.Content>
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 bg-bgAmberLight dark:bg-bgAmberDark ">
          <FontAwesomeIcon
            icon={WarningIcon}
            className="h-6 w-6 text-iconAmberLight dark:text-iconAmberDark"
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
          <h3 className="font-medium text-[18px] leading-7 text-titleLight dark:text-titleDark">
            {t('Login.Delete account', {
              username: truncate(account?.username || '', 30)
            })}
          </h3>
        </div>
      </Modal.Content>
      <Modal.Actions>
        <Button
          variant="danger"
          className="font-medium text-[14px] leading-5"
          onClick={handleDeleteAccount}
        >
          {t('Common.Delete')}
        </Button>
        <Button
          variant="ghost"
          className="font-medium text-[14px] leading-5 gap-3"
          onClick={handleCancel}
          ref={cancelDeleteButtonRef}
        >
          <p className="dark:text-textBlueDark text-textBlueLight">
            {t('Common.Cancel')}
          </p>
        </Button>
      </Modal.Actions>
    </Modal>
  )
}
