import {
  faCirclePlus as AddSpeedDialIcon,
  faBolt as SpeedDialEmptyListIcon
} from '@fortawesome/free-solid-svg-icons'
import { SpeedDialNumber } from './SpeedDialNumber'
import { ContactType } from '@shared/types'
import { t } from 'i18next'
import { SkeletonRow } from '@renderer/components/SkeletonRow'
import { useStoreState } from '@renderer/store'
import { usePhoneIslandEventHandler } from '@renderer/hooks/usePhoneIslandEventHandler'
import { useSpeedDialsModule } from './hook/useSpeedDialsModule'
import { Scrollable } from '@renderer/components/Scrollable'
import { ModuleTitle } from '@renderer/components/ModuleTitle'
import { EmptyList } from '@renderer/components/EmptyList'

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
    <>
      <ModuleTitle
        title={t('SpeedDial.Speed dial')}
        action={handleCreateSpeedDial}
        actionIcon={AddSpeedDialIcon}
        actionText={t('SpeedDial.Create')}
      />
      <Scrollable >
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
            <EmptyList icon={SpeedDialEmptyListIcon} text={t('SpeedDial.No speed dials')} />
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
