import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons'
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
    <div className="flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center py-1 border border-t-0 border-r-0 border-l-0 dark:border-gray-700 border-gray-200 font-semibold max-h-[28px]">
        <h1 className="dark:text-gray-50 text-gray-900">{t('SpeedDial.Speed dial')}</h1>
        <Button
          className="flex gap-3 items-center pt-0 pr-0 pb-0 pl-0"
          onClick={showCreateSpeedDial}
        >
          <FontAwesomeIcon
            className="dark:text-blue-500 text-blue-600 text-base"
            icon={faCirclePlus}
          />
          <p className="dark:text-blue-500 text-blue-600 font-semibold">{t('SpeedDial.Create')}</p>
        </Button>
      </div>
      <div className="flex flex-col gap-2 p-2 min-h-[120px] max-h-[240px] overflow-y-auto">
        {speeddials && speeddials.length > 0 ? (
          speeddials?.map((e, idx) => {
            return (
              <div
                className={`${idx === speeddials.length - 1 ? `` : `border-b pb-2 dark:border-gray-700 border-gray-200`}`}
                key={idx}
              >
                <SpeedDialNumber
                  speedDial={e}
                  callUser={() => callUser(e.speeddial_num!)}
                  handleSelectedSpeedDial={handleSelectedSpeedDial}
                  handleDeleteSpeedDial={handleDeleteSpeedDial}
                  isLastItem={speeddials.length === 1 ? false : idx === speeddials.length - 1}
                />
              </div>
            )
          })
        ) : (
          <div className="font-semibold dark:text-gray-50 text-gray-900 dark:bg-gray-900 bg-gray-50">
            {t('SpeedDial.No speed dials')}
          </div>
        )}
      </div>
    </div>
  )
}
