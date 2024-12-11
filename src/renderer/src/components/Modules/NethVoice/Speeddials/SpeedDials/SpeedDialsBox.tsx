import {
  faCirclePlus as AddSpeedDialIcon,
  faBolt as SpeedDialIcon
} from '@fortawesome/free-solid-svg-icons'
import { ContactType } from '@shared/types'
import { t } from 'i18next'
import { SkeletonRow } from '@renderer/components/SkeletonRow'
import { useSpeedDialsModule } from '../hook/useSpeedDialsModule'
import { Scrollable } from '@renderer/components/Scrollable'
import { ModuleTitle } from '@renderer/components/ModuleTitle'
import { ContactNumber } from '../shared/ContactNumber'
import { EmptyList } from '@renderer/components/EmptyList'

export function SpeedDialsBox({ showSpeedDialForm, showDeleteSpeedDialDialog }): JSX.Element {
  const speedDialModule = useSpeedDialsModule()
  const { speedDials } = speedDialModule
  const [, setSelectedSpeedDial] = speedDialModule.speedDialsState

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
    <>
      <ModuleTitle
        title={t('SpeedDial.Speed dial')}
        action={handleCreateSpeedDial}
        actionIcon={AddSpeedDialIcon}
        actionText={t('SpeedDial.Create')}
      />
      <Scrollable >
        {speedDials ? (
          speedDials.length > 0 ? (
            speedDials?.map((e, idx) => {
              return (
                <div key={idx} className="dark:hover:bg-hoverDark hover:bg-hoverLight">
                  <div className="px-5">
                    <div
                      className={`${idx === speedDials.length - 1 ? `` : `border-b dark:border-borderDark border-borderLight`}`}
                    >
                      <ContactNumber
                        speedDial={e}
                        handleEditSpeedDial={handleEditSpeedDial}
                        handleDeleteSpeedDial={handleDeleteSpeedDial}
                        isFavouritePage={false}
                        isLastItem={speedDials.length === 1 ? false : idx === speedDials.length - 1}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <EmptyList icon={SpeedDialIcon} text={t('SpeedDial.No speed dials')} />
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
    </>
  )
}
