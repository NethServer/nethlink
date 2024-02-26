import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare, faCheck } from '@fortawesome/free-solid-svg-icons'
import { MissedCall } from './MissedCall'
import { CallData } from '@shared/types'
import { Button } from './Nethesis/Button'

export interface MissedCallsBoxProps {
  missedCalls: CallData[]
  title: string
  label?: string
  onClick?: () => void
  isContactSaved: boolean
}

export function MissedCallsBox({
  missedCalls,
  title,
  label,
  onClick,
  isContactSaved
}: MissedCallsBoxProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4 min-h-[284px]">
      {isContactSaved && (
        <div className="flex flex-row items-center gap-2 py-1 px-3 rounded-[4px] max-h-6 max-w-[140px] text-gray-100 bg-green-700">
          <FontAwesomeIcon icon={faCheck} className="text-[16px]" />
          <p className="font-semibold text-sm">Contact saved</p>
        </div>
      )}
      <div className="flex justify-between items-center py-1 border border-t-0 border-r-0 border-l-0 border-gray-700 font-semibold max-h-[28px]">
        <h1>{title}</h1>
        <Button className="flex gap-3 items-center pt-0 pr-0 pb-0 pl-0" onClick={onClick}>
          <FontAwesomeIcon
            style={{ fontSize: '16px', color: '#3B82F6' }}
            icon={faArrowUpRightFromSquare}
          />
          <p className="text-blue-500">{label}</p>
        </Button>
      </div>
      <div className="flex flex-col gap-2 p-2 max-h-[240px] overflow-y-auto">
        {missedCalls?.map((call, idx) => {
          return (
            <div
              className={`${idx === missedCalls.length - 1 ? `` : `border-b pb-2 border-gray-700`}`}
              key={idx}
            >
              <MissedCall
                username={call.cnam!}
                number={call.cnum!}
                time={call.time!}
                duration={call.duration!}
                company={call.ccompany!}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
