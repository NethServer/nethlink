import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpRightFromSquare as ShowMissedCallIcon } from '@fortawesome/free-solid-svg-icons'
import { LastCall } from './LastCall'
import { CallData, LastCallData, OperatorData } from '@shared/types'
import { t } from 'i18next'
import { useStoreState } from '@renderer/store'
import { Button } from '@renderer/components/Nethesis'
import { SkeletonRow } from '@renderer/components/SkeletonRow'
import { useEffect, useState } from 'react'
import { log } from '@shared/utils/logger'
import { Scrollable } from '@renderer/components/Scrollable'
import { ModuleTitle } from '@renderer/components/ModuleTitle'

export function LastCallsBox({ showContactForm }): JSX.Element {

  const [lastCalls] = useStoreState<CallData[]>('lastCalls')
  const [operators] = useStoreState<OperatorData>('operators')
  const [missedCalls, setMissedCalls] = useStoreState<CallData[]>('missedCalls')
  const [preparedCalls, setPreparedCalls] = useState<LastCallData[]>([])
  const title = `${t('LastCalls.Calls', { count: lastCalls?.length })} (${lastCalls?.length || 0})`

  useEffect(() => {
    prepareCalls()
  }, [lastCalls, missedCalls])

  const viewAllMissedCalls = () => {
    window.api.openHostPage('/history')
  }

  const prepareCalls = () => {
    if (lastCalls) {
      const preparedCalls: LastCallData[] = lastCalls.map((c) => {
        const elem: LastCallData = {
          ...c,
          username: getCallName(c),
          hasNotification: missedCalls?.map((c) => c.uniqueid).includes(c.uniqueid) || false
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

  const handleClearNotification = (missedCall: CallData) => {
    log(missedCall, missedCalls)
    setMissedCalls((p) => {
      return p?.filter((c) => c.uniqueid !== missedCall.uniqueid) || []
    })
  }

  return (
    <>
      <ModuleTitle
        title={title}
        action={viewAllMissedCalls}
        actionIcon={ShowMissedCallIcon}
        actionText={t('Common.View all')}
      />
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
                      clearNotification={handleClearNotification}
                      className="dark:hover:bg-hoverDark hover:bg-hoverLight"
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
    </>
  )
}
