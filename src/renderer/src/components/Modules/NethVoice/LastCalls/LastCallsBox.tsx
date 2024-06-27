import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare as ShowMissedCallIcon } from '@fortawesome/free-solid-svg-icons'
import { MissedCall } from './LastCall'
import { CallData } from '@shared/types'
import { t } from 'i18next'
import { useStoreState } from '@renderer/store'
import { Button } from '@renderer/components/Nethesis'
import { SkeletonRow } from '@renderer/components/SkeletonRow'

export function MissedCallsBox({ showContactForm }): JSX.Element {
  const [lastCalls] = useStoreState<CallData[]>('lastCalls')
  const missedCallsIn = lastCalls?.filter(
    (call) => call.direction === 'in' && call.disposition === 'NO ANSWER'
  )
  const title = `${t('QueueManager.Missed calls')} (${missedCallsIn?.length || 0})`

  const viewAllMissedCalls = () => {
    window.api.openHostPage('/history')
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="px-5">
          <div className="flex justify-between items-center pb-4 border border-t-0 border-r-0 border-l-0 dark:border-borderDark border-borderLight max-h-[28px] mt-3">
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
        </div>
        <div className="flex flex-col max-h-[240px] overflow-y-auto">
          {missedCallsIn
            ? missedCallsIn.map((call, idx) => {
                return (
                  <div key={idx} className="dark:hover:bg-hoverDark hover:bg-hoverLight">
                    <div className="px-5">
                      <div
                        className={`${idx === missedCallsIn.length - 1 ? `` : `border-b dark:border-borderDark border-borderLight`}`}
                        key={idx}
                      >
                        <MissedCall call={call} showContactForm={showContactForm} />
                      </div>
                    </div>
                  </div>
                )
              })
            : Array(3)
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
                })}
        </div>
      </div>
    </>
  )
}
