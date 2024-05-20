import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCirclePlus as AddSpeedDialIcon } from '@fortawesome/free-solid-svg-icons'
import { SpeedDialNumber } from './SpeedDialNumber'
import { ContactType } from '@shared/types'
import { Button } from './Nethesis/Button'
import { t } from 'i18next'

export interface SpeedDialsBoxProps {
  speeddials: ContactType[] | undefined
  callUser: (phoneNumber: string) => void
  showCreateSpeedDial: () => void
  handleSelectedSpeedDial: (selectedSpeedDial: ContactType) => void
  handleDeleteSpeedDial: (deleteSpeeddial: ContactType) => void
}

export function SpeedDialsBox({
  speeddials,
  callUser,
  showCreateSpeedDial,
  handleSelectedSpeedDial,
  handleDeleteSpeedDial
}: SpeedDialsBoxProps): JSX.Element {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center pb-4 border border-t-0 border-r-0 border-l-0 dark:border-borderDark border-borderLight max-h-[28px] px-5 mt-3">
        <h1 className="dark:text-titleDark text-titleLight font-medium text-[14px] leading-5">
          {t('SpeedDial.Speed dial')}
        </h1>
        <Button
          variant="ghost"
          className="flex gap-3 items-center pt-2 pr-1 pb-2 pl-1"
          onClick={showCreateSpeedDial}
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
      <div className="flex flex-col min-h-[120px] max-h-[240px] overflow-y-auto">
        {speeddials && speeddials.length > 0 ? (
          speeddials?.map((e, idx) => {
            return (
              <div
                className={`${idx === speeddials.length - 1 ? `` : `border-b dark:border-borderDark border-borderLight`}`}
                key={idx}
              >
                <SpeedDialNumber
                  speedDial={e}
                  className="dark:hover:bg-hoverDark hover:bg-hoverLight"
                  callUser={() => callUser(e.speeddial_num!)}
                  handleSelectedSpeedDial={handleSelectedSpeedDial}
                  handleDeleteSpeedDial={handleDeleteSpeedDial}
                  isLastItem={speeddials.length === 1 ? false : idx === speeddials.length - 1}
                />
              </div>
            )
          })
        ) : (
          <div className="dark:text-titleDark text-titleLight dark:bg-bgDark bg-bgLight px-5 py-2">
            {t('SpeedDial.No speed dials')}
          </div>
        )}
      </div>
    </div>
  )
}
