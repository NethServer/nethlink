import {
  faArrowUpRightFromSquare as ShowMissedCallIcon,
  faPhone as EmptyResultIcon,
} from '@fortawesome/free-solid-svg-icons'
import { LastCall } from './LastCall'
import { CallData, LastCallData } from '@shared/types'
import { t } from 'i18next'
import { useNethlinkData } from '@renderer/store'
import { SkeletonRow } from '@renderer/components/SkeletonRow'
import { useEffect, useState } from 'react'
import { Scrollable } from '@renderer/components/Scrollable'
import { ModuleTitle } from '@renderer/components/ModuleTitle'
import { EmptyList } from '@renderer/components/EmptyList'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'

export function LastCallsBox({ showContactForm }): JSX.Element {
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()
  const [lastCalls] = useNethlinkData('lastCalls')
  const [operators] = useNethlinkData('operators')
  const [missedCalls, setMissedCalls] = useNethlinkData('missedCalls')
  const [preparedCalls, setPreparedCalls] = useState<LastCallData[]>([])
  const [audioTestCode, setAudioTestCode] = useState<string>('*41')
  const [createButtonCallKey, setCreateButtonCallKey] = useState<string | null>(
    null,
  )

  useEffect(() => {
    prepareCalls()
  }, [lastCalls, missedCalls, audioTestCode])

  useEffect(() => {
    const loadFeatureCodes = async () => {
      try {
        const codes = await NethVoiceAPI.AstProxy.featureCodes()
        if (codes?.audio_test) {
          setAudioTestCode(codes.audio_test)
        }
      } catch (error) {
        console.error('Failed to load feature codes:', error)
      }
    }
    loadFeatureCodes()
  }, [])

  const viewAllMissedCalls = () => {
    window.api.openHostPage('/history')
  }

  const prepareCalls = () => {
    if (lastCalls) {
      const missedCallIds = new Set(missedCalls?.map(c => c.uniqueid))
      const preparedCalls: LastCallData[] = lastCalls
        .map((c) => ({
          ...c,
          username: getCallName(c),
          hasNotification: missedCallIds.has(c.uniqueid),
        }))
        .filter((call) => {
          const numberToCheck = call.direction === 'in' ? call.src : call.dst
          return !numberToCheck?.includes(audioTestCode)
        })
      setPreparedCalls(preparedCalls)
    }
  }

  function getCallName(call: CallData): string {
    let callName =
      call.direction === 'out'
        ? call?.dst_cnam || call?.dst_ccompany
        : call.direction === 'in'
          ? call?.cnam || call?.ccompany
          : undefined
    let operator: any = null
    if (callName) {
      operator = Object.values(operators?.operators || {}).find(
        (operator: any) => operator.name === callName,
      )
    } else {
      operator = Object.values(operators?.operators || {}).find(
        (operator: any) => {
          const isExten = operator.endpoints?.extension?.find(
            (exten: any) => exten.id === call.dst,
          )
          return isExten ? true : false
        },
      )
    }
    return operator?.username || t('Common.Unknown') //speeddialName ||
  }

  const handleClearNotification = (missedCall: CallData) => {
    setMissedCalls((p) => {
      return p?.filter((c) => c.uniqueid !== missedCall.uniqueid) || []
    })
  }

  const canShowCreateButton = (call: LastCallData) => {
    return call.direction === 'in'
      ? !(call.src || call.ccompany)
      : call.direction === 'out'
        ? !(call.dst_cnam || call.dst_ccompany)
        : false
  }

  return (
    <>
      <ModuleTitle
        title={t('LastCalls.Last calls')}
        action={viewAllMissedCalls}
        actionIcon={ShowMissedCallIcon}
        actionText={t('Common.View all')}
      />
      <Scrollable className=''>
        {preparedCalls ? (
          preparedCalls.length > 0 ? (
            preparedCalls.map((preparedCall, idx) => {
              const callKey = `${preparedCall?.uniqueid}_${idx}`
              return (
                <div
                  className='dark:hover:bg-hoverDark hover:bg-hoverLight'
                  key={callKey}
                  onMouseEnter={() => {
                    setCreateButtonCallKey(
                      canShowCreateButton(preparedCall) ? callKey : null,
                    )
                  }}
                  onMouseLeave={() => setCreateButtonCallKey(null)}
                  onClick={() => {
                    handleClearNotification(preparedCall)
                  }}
                >
                  <div className='px-5'>
                    <div
                      className={`${idx === preparedCalls.length - 1 ? `` : `border-b dark:border-borderDark border-borderLight`}`}
                    >
                      <LastCall
                        call={preparedCall}
                        showContactForm={showContactForm}
                        showCreateButton={createButtonCallKey === callKey}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <EmptyList
              icon={EmptyResultIcon}
              text={t('History.There are no calls in your history')}
            />
          )
        ) : (
          Array(3)
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
            })
        )}
      </Scrollable>
    </>
  )
}
