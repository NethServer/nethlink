import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { MissedCall } from './MissedCall'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { useState } from 'react'
import { CallData, HistoryCallData } from '@shared/types'
import { Button } from './Nethesis/Button'

export interface MissedCallsBoxProps {
  title: string
  label?: string
  onClick?: () => void
}

export function MissedCallsBox({ title, label, onClick }: MissedCallsBoxProps): JSX.Element {
  const [missedCalls, setMissedCalls] = useState<CallData[]>([])
  useInitialize(() => {
    window.api.onReciveLastCalls(saveMissedCalls)

    //TODO da guardare come passare la tipologia di MissedCall, tipo commercial, customer care...
    saveMissedCalls({
      count: 3,
      rows: [
        { cnam: 'Tanya Fox', cnum: '530', duration: 1, time: 14 },
        { cnam: 'Unknown', cnum: '333 756 0091', duration: 10, time: 12, ccompany: 'Commercial' },
        {
          cnam: 'Maple office customer service',
          cnum: '02 3456785',
          duration: 10,
          time: 12,
          ccompany: 'Customer Care'
        }
      ]
    })
  })

  async function saveMissedCalls(historyResponse: HistoryCallData) {
    setMissedCalls(() => historyResponse.rows)
  }

  return (
    <div className="flex flex-col gap-4 min-h-[284px]">
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
      <div className="flex flex-col gap-2 p-2 min-h-[240px]">
        {missedCalls?.map((call, idx) => {
          return (
            <div
              className={`${idx === missedCalls.length - 1 ? `` : `border-b pb-2 border-gray-700`}`}
              key={idx}
            >
              <MissedCall
                name={call.cnam!}
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
