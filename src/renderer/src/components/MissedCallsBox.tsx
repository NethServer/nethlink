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
  /* TODO modificare richiesta al server */
  const missedCallsIn = missedCalls?.filter(
    (call) => call.direction === 'in' && call.disposition === 'NO ANSWER'
  )
  const title = `${t('QueueManager.Missed calls')} (${missedCallsIn.length})`

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center pb-4 border border-t-0 border-r-0 border-l-0 dark:border-gray-700 border-gray-200 max-h-[28px] px-5 mt-3">
          <h1 className="font-medium text-[14px] leading-5">{title}</h1>
          <Button
            variant="ghost"
            className="flex gap-3 items-center pt-2 pr-1 pb-2 pl-1 hover:bg-gray-200 dark:hover:bg-gray-600 dark:focus:ring-2 focus:ring-2 dark:focus:ring-blue-200 focus:ring-blue-500"
            onClick={viewAllMissedCalls}
          >
            <FontAwesomeIcon
              className="text-base dark:text-blue-500 text-blue-700"
              icon={ShowMissedCallIcon}
            />
            <p className="dark:text-blue-500 text-blue-700 font-medium text-[14px] leading-5">
              {t('Common.View all')}
            </p>
          </Button>
        </div>
        <div className="flex flex-col max-h-[240px] overflow-y-auto">
          {missedCallsIn.map((call, idx) => {
            return (
              <div
                className={`${idx === missedCallsIn.length - 1 ? `` : `border-b dark:border-gray-700 border-gray-200`}`}
                key={idx}
              >
                <MissedCall
                  call={call}
                  className="dark:hover:bg-gray-600 hover:bg-gray-200"
                  handleSelectedMissedCall={handleSelectedMissedCall}
                />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
