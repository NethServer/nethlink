import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare as ShowMissedCallIcon } from '@fortawesome/free-solid-svg-icons'
import { LastCall } from './LastCall'
import { CallData, OperatorData } from '@shared/types'
import { t } from 'i18next'
import { useStoreState } from '@renderer/store'
import { Button } from '@renderer/components/Nethesis'
import { SkeletonRow } from '@renderer/components/SkeletonRow'
import { Scrollable } from '@renderer/components/Scrollable'
import { useEffect, useState } from 'react'

export function LastCallsBox({ showContactForm }): JSX.Element {

  const [lastCalls] = useStoreState<CallData[]>('lastCalls')
  const [operators] = useStoreState<OperatorData>('operators')
  const [preparedCalls, setPreparedCalls] = useState<(CallData & { username: string })[]>([])
  const title = `${t('QueueManager.Calls')} (${lastCalls?.length || 0})`

  useEffect(() => {
    prepareCalls()
  }, [lastCalls])

  const viewAllMissedCalls = () => {
    window.api.openHostPage('/history')
  }

  const prepareCalls = () => {
    if (lastCalls) {
      const preparedCalls: (CallData & { username: string })[] = lastCalls.map((c) => {
        const elem: CallData & { username: string } = {
          ...c,
          username: getCallName(c)
        }
        return elem
      })
      setPreparedCalls((p) => preparedCalls)
    }
  }

  function getCallName(call: CallData): string {
    //`${t('Common.Unknown')}`
    let callName = call.direction === 'out'
      ? (call?.dst_cnam || call?.dst_ccompany)
      : call.direction === 'in'
        ? (call?.cnam || call?.ccompany)
        : undefined
    let operator: any = null
    if (callName) {
      operator = Object.values(operators?.operators || {}).find((operator: any) => operator.name === callName)
    } else {
      operator = Object.values(operators?.operators || {}).find((operator: any) => {
        const isExten = operator.endpoints.extension.find((exten: any) => exten.id === call.dst)
        return isExten ? true : false
      })
    }
    return operator?.username || t('Common.Unknown')
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
        <Scrollable className="flex flex-col max-h-[240px]">
          {
            preparedCalls ? preparedCalls.map((preparedCall, idx) => {
              return (
                <div
                  className="dark:hover:bg-hoverDark hover:bg-hoverLight"
                  key={idx}
                >
                  <div className="px-5">
                    <div
                      className={`${idx === preparedCalls.length - 1 ? `` : `border-b dark:border-borderDark border-borderLight`}`}
                    >
                      <LastCall
                        call={preparedCall}
                        showContactForm={showContactForm}
                      />
                    </div>
                  </div>
                </div>
              )
            }) : Array(3).fill('').map((_, idx) => {
              return <div
                className={`${idx === 2 ? `` : `border-b dark:border-borderDark border-borderLight`}`}
                key={idx}
              >
                <SkeletonRow />
              </div>
            })
          }
        </Scrollable >
      </div >
    </>
  )
}
