import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCirclePlus as AddSpeedDialIcon } from '@fortawesome/free-solid-svg-icons'
import { SpeedDialNumber } from './SpeedDialNumber'
import { ContactType, NethLinkPageData } from '@shared/types'
import { t } from 'i18next'
import { SkeletonRow } from '@renderer/components/SkeletonRow'
import { useStoreState } from '@renderer/store'
import { Button } from '@renderer/components/Nethesis'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useSpeedDialsModule } from './hook/useSpeedDialsModule'
import { log } from '@shared/utils/logger'
import { Scrollable } from '@renderer/components/Scrollable'

export function SpeedDialsBox({ showSpeedDialForm, showDeleteSpeedDialDialog }): JSX.Element {
  const [speeddials] = useStoreState<ContactType[]>('speeddials')
  const speedDialModule = useSpeedDialsModule()
  const [selectedSpeedDial, setSelectedSpeedDial] = speedDialModule.speedDialsState
  const { callNumber } = usePhoneIslandEventHandler()

  function handleCreateSpeedDial(): void {
    setSelectedSpeedDial(undefined)
    showSpeedDialForm()
  }

  function handleEditSpeedDial(speedDial: ContactType): void {
    setSelectedSpeedDial(speedDial)
    showSpeedDialForm()
  }

  function handleDeleteSpeedDial(speedDial: ContactType): void {
    setSelectedSpeedDial(speedDial)
    showDeleteSpeedDialDialog()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5">
        <div className="flex justify-between items-center pb-4 border border-t-0 border-r-0 border-l-0 dark:border-borderDark border-borderLight max-h-[28px] mt-3">
          <h1 className="dark:text-titleDark text-titleLight font-medium text-[14px] leading-5">
            {t('SpeedDial.Speed dial')}
          </h1>
          <Button
            variant="ghost"
            className="flex gap-3 items-center pt-2 pr-1 pb-2 pl-1"
            onClick={handleCreateSpeedDial}
          >
            <FontAwesomeIcon
              className="dark:text-textBlueDark text-textBlueLight text-base"
              icon={AddSpeedDialIcon}
            />
            <p className="dark:text-textBlueDark text-textBlueLight font-medium text-[14px] leading-5">
              {t('SpeedDial.Create')}
            </p>
          </Button>
        </div>
      </div>
      <Scrollable className="flex flex-col min-h-[120px] max-h-[240px]">
        {speeddials ? (
          speeddials.length > 0 ? (
            speeddials?.map((e, idx) => {
              return (
                <div key={idx} className="dark:hover:bg-hoverDark hover:bg-hoverLight">
                  <div className="px-5">
                    <div
                      className={`${idx === speeddials.length - 1 ? `` : `border-b dark:border-borderDark border-borderLight`}`}
                    >
                      <SpeedDialNumber
                        speedDial={e}
                        callUser={() => callNumber(e.speeddial_num!)}
                        handleEditSpeedDial={handleEditSpeedDial}
                        handleDeleteSpeedDial={handleDeleteSpeedDial}
                        isLastItem={speeddials.length === 1 ? false : idx === speeddials.length - 1}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="dark:text-titleDark text-titleLight dark:bg-bgDark bg-bgLight px-5 py-2">
              {t('SpeedDial.No speed dials')}
            </div>
          )
        ) : (
          Array(3)
            .fill('')
            .map((_, idx) => {
              return (
                <div
                  className={`${idx === 2 ? `` : `border-b dark:border-borderDark border-borderLight`}`}
                  key={idx}
                >
                  <SkeletonRow />
                </div>
              )
            })
        )}
      </Scrollable>
    </div>
  )
}
