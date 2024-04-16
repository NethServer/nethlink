import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare as ShowMissedCallIcon } from '@fortawesome/free-solid-svg-icons'
import { MissedCall } from './MissedCall'
import { CallData } from '@shared/types'
import { Button } from './Nethesis/Button'
import { t } from 'i18next'

export interface MissedCallsBoxProps {
  missedCalls: CallData[]
  viewAllMissedCalls?: () => void
  handleSelectedMissedCall: (number: string, company: string | undefined) => void
}

export function MissedCallsBox({
  missedCalls,
  viewAllMissedCalls,
  handleSelectedMissedCall
}: MissedCallsBoxProps): JSX.Element {
  /* Oltre al fatto che sono le chiamate in entrate esse non devono aver avuto risposta */
  const missedCallsIn = missedCalls?.filter(
    (call) => call.direction === 'in' && call.disposition === 'NO ANSWER'
  )
  const title = `${t('QueueManager.Missed calls')} (${missedCallsIn.length})`

  return (
    <>
      <div className="flex flex-col gap-4 h-full">
        <div className="flex justify-between items-center py-1 border border-t-0 border-r-0 border-l-0 dark:border-gray-700 border-gray-200 max-h-[28px]">
          <h1 className="dark:text-gray-50 text-gray-900 font-medium">{title}</h1>
          <Button
            className="flex gap-3 items-center pt-0 pr-0 pb-0 pl-0"
            onClick={viewAllMissedCalls}
          >
            <FontAwesomeIcon
              className="text-base dark:text-blue-500 text-blue-600"
              icon={ShowMissedCallIcon}
            />
            <p className="dark:text-blue-500 text-blue-600 font-medium">{t('Common.View all')}</p>
          </Button>
        </div>
        <div className="flex flex-col gap-2 p-2 max-h-[240px] overflow-y-auto">
          {missedCallsIn.map((call, idx) => {
            return (
              <div
                className={`${idx === missedCalls.length - 1 ? `` : `border-b pb-2 dark:border-gray-700 border-gray-200`}`}
                key={idx}
              >
                <MissedCall call={call} handleSelectedMissedCall={handleSelectedMissedCall} />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
