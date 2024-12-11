import { Modal } from "@renderer/components"
import { Button } from "@renderer/components/Nethesis"
import { useSharedState } from "@renderer/store"
import { parseThemeToClassName, sendNotification, truncate } from "@renderer/utils"
import { ContactType } from "@shared/types"
import { t } from "i18next"
import { createRef } from "react"
import { useSpeedDialsModule } from "../hook/useSpeedDialsModule"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faTriangleExclamation as WarningIcon
} from '@fortawesome/free-solid-svg-icons'
export const SpeedDialDeleteDialog = ({
  close
}) => {

  const cancelDeleteButtonRef = createRef<HTMLButtonElement>()
  const speedDialModule = useSpeedDialsModule()
  const [selectedSpeedDial, setSelectedSpeedDial] = speedDialModule.speedDialsState
  const [theme] = useSharedState('theme')



  function confirmDeleteSpeedDial(speedDial: ContactType) {
    speedDialModule.deleteSpeedDial(speedDial).then((_) => {
      sendNotification(
        t('Notification.speeddial_deleted_title'),
        t('Notification.speeddial_deleted_description')
      )
      setSelectedSpeedDial(undefined)
      close()
    })
      .catch((error) => {
        sendNotification(
          t('Notification.speeddial_not_deleted_title'),
          t('Notification.speeddial_not_deleted_description')
        )
      })
  }

  const handleDeleteSpeedDial = () => {
    confirmDeleteSpeedDial(selectedSpeedDial!)
    close()
  }

  const handleCancel = () => {
    setSelectedSpeedDial(undefined)
    close()
  }

  return (
    <Modal
      show={true}
      focus={cancelDeleteButtonRef}
      onClose={() => close()}
      afterLeave={() => setSelectedSpeedDial(undefined)}
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
            {t('SpeedDial.Delete speed dial')}
          </h3>
          <div className="mt-3">
            <p className="font-normal text-[14px] leading-5 text-gray-700 dark:text-gray-200">
              {t('SpeedDial.Speed dial delete message', {
                deletingName: truncate(selectedSpeedDial?.name || '', 30)
              })}
            </p>
          </div>
        </div>
      </Modal.Content>
      <Modal.Actions>
        <Button
          variant="danger"
          className="font-medium text-[14px] leading-5"
          onClick={handleDeleteSpeedDial}
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
