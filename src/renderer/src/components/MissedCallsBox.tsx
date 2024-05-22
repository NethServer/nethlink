import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare as ShowMissedCallIcon } from '@fortawesome/free-solid-svg-icons'
import { MissedCall } from './MissedCall'
import { CallData } from '@shared/types'
import { Button } from './Nethesis/Button'
import { t } from 'i18next'
import { SkeletonRow } from './SkeletonRow'
import { useSubscriber } from '@renderer/hooks/useSubscriber'

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

  const isDataLoaded = useSubscriber<boolean>('loadDataEnded')
  /* Oltre al fatto che sono le chiamate in entrate esse non devono aver avuto risposta */
  /* TODO modificare richiesta al server */
  const missedCallsIn = missedCalls?.filter(
    (call) => call.direction === 'in' && call.disposition === 'NO ANSWER'
  )
  const title = `${t('QueueManager.Missed calls')} (${missedCallsIn.length})`

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center pb-4 border border-t-0 border-r-0 border-l-0 dark:border-borderDark border-borderLight max-h-[28px] px-5 mt-3">
          <h1 className="font-medium text-[14px] leading-5 dark:text-titleDark text-titleLight">
            {title}
          </h1>
          <Button
            variant="ghost"
            className="flex gap-3 items-center pt-2 pr-1 pb-2 pl-1"
            onClick={viewAllMissedCalls}
          >
            <FontAwesomeIcon
              className="text-base dark:text-textBlueDark text-textBlueLight"
              icon={ShowMissedCallIcon}
            />
            <p className="dark:text-textBlueDark text-textBlueLight font-medium text-[14px] leading-5">
              {t('Common.View all')}
            </p>
          </Button>
        </div>
        <div className="flex flex-col max-h-[240px] overflow-y-auto">
          {isDataLoaded ? (missedCallsIn.map((call, idx) => {
            return (
              <div
                className={`${idx === missedCallsIn.length - 1 ? `` : `border-b dark:border-borderDark border-borderLight`}`}
                key={idx}
              >
                <MissedCall
                  call={call}
                  className="dark:hover:bg-hoverDark hover:bg-hoverLight"
                  handleSelectedMissedCall={handleSelectedMissedCall}
                />
              </div>
            )
          })) : Array(3).fill('').map((_, idx) => {
            return <div
              className={`${idx === 2 ? `` : `border-b dark:border-borderDark border-borderLight`}`}
              key={idx}
            >
              <SkeletonRow />

            </div>
          })}
        </div>
      </div>
    </>
  )
}
