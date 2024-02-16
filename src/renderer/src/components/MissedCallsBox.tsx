import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@nethesis/react-components/src/components/common'
import { MissedCall } from './MissedCall'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { useState } from 'react'
import { CallData, HistoryCallData } from '@shared/types'

export interface MissedCallsBoxProps {
  title: string
  label?: string
  onClick?: () => void
}

export function MissedCallsBox({ title, label, onClick }: MissedCallsBoxProps): JSX.Element {

  const [missedCalls, setMissedCalls] = useState<CallData[]>([])
  useInitialize(() => {
    window.api.onReciveLastCalls(saveMissedCalls)
  })

  async function saveMissedCalls(historyResponse: HistoryCallData) {
    setMissedCalls(historyResponse.rows)
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
      <div className="flex flex-col gap-2 p-2 min-h-[240px] overflow-y-auto">
        {missedCalls?.map((call) => {
          return (
            <div className="border-b pb-2 border-gray-700">
              <MissedCall name={call.cnam} number={call.cnum} time={call.time} />
            </div>
          )
        })}
      </div>
    </div>
  )
}


