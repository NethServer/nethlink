import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { MissedCall } from './MissedCall'
import { CallData } from '@shared/types'
import { Button } from './Nethesis/Button'

export interface MissedCallsBoxProps {
  missedCalls: CallData[]
  title: string
  label?: string
  viewAllMissedCalls?: () => void
  //isAddingToPhonebook: boolean
  showAddContactToPhonebook: () => void
}

export function MissedCallsBox({
  missedCalls,
  title,
  label,
  viewAllMissedCalls,
  showAddContactToPhonebook
  //isAddingToPhonebook
}: MissedCallsBoxProps): JSX.Element {
  return (
    <>
      <div className="flex flex-col gap-4 min-h-[284px]">
        <div className="flex justify-between items-center py-1 border border-t-0 border-r-0 border-l-0 dark:border-gray-700 border-gray-200 font-semibold max-h-[28px]">
          <h1>{title}</h1>
          <Button
            className="flex gap-3 items-center pt-0 pr-0 pb-0 pl-0"
            onClick={viewAllMissedCalls}
          >
            <FontAwesomeIcon
              className="text-base dark:text-blue-500 text-blue-600"
              icon={faArrowUpRightFromSquare}
            />
            <p className="dark:text-blue-500 text-blue-600 font-semibold">{label}</p>
          </Button>
        </div>
        <div className="flex flex-col gap-2 p-2 max-h-[240px] overflow-y-auto">
          {missedCalls?.map((call, idx) => {
            return (
              <div
                className={`${idx === missedCalls.length - 1 ? `` : `border-b pb-2 dark:border-gray-700 border-gray-200`}`}
                key={idx}
              >
                {/* Prova per forzare il button create */}
                <MissedCall
                  username={'Unknown'}
                  //username={call.cnam!}
                  number={call.cnum!}
                  time={call.time!}
                  duration={call.duration!}
                  company={'Customer care'}
                  showAddContactToPhonebook={showAddContactToPhonebook}
                  //isAddingToPhonebook={isAddingToPhonebook}
                  //company={call.ccompany!}
                />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
