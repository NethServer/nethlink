import {
  faArrowUpRightFromSquare as ShowMissedCallIcon,
  faPhone as EmptyResultIcon
} from '@fortawesome/free-solid-svg-icons'
import { LastCall } from './LastCall'
import { CallData, LastCallData } from '@shared/types'
import { t } from 'i18next'
import { useSharedState } from '@renderer/store'
import { SkeletonRow } from '@renderer/components/SkeletonRow'
import { useEffect, useState } from 'react'
import { Scrollable } from '@renderer/components/Scrollable'
import { ModuleTitle } from '@renderer/components/ModuleTitle'
import { EmptyList } from '@renderer/components/EmptyList'

export function LastCallsBox({ showContactForm }): JSX.Element {

  const [lastCalls] = useSharedState('lastCalls')
  const [operators] = useSharedState('operators')
  const [missedCalls, setMissedCalls] = useSharedState('missedCalls')
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
        const isExten = operator.endpoints?.extension?.find((exten: any) => exten.id === call.dst)
        return isExten ? true : false
      })
    }
    return operator?.username || t('Common.Unknown') //speeddialName ||
  }

  const handleClearNotification = (missedCall: CallData) => {
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
      <Scrollable className="">
        {
          preparedCalls ?
            preparedCalls.length > 0
              ? preparedCalls.map((preparedCall, idx) => {
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
              })
              : <EmptyList icon={EmptyResultIcon} text={t('History.There are no calls in your history')} />
            : Array(3).fill('').map((_, idx) => {
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
