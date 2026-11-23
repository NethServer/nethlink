import {
  faArrowUpRightFromSquare as ShowMissedCallIcon,
  faClockRotateLeft as EmptyResultIcon,
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
      const missedCallIds = new Set(missedCalls?.map((c) => c.uniqueid))
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
    const callName =
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
    return operator?.username || t('Common.Unknown') // speeddialName ||
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
        actionText={t('LastCalls.Open history')}
      />
      <Scrollable>
        {preparedCalls ? (
          preparedCalls.length > 0 ? (
            preparedCalls.map((preparedCall, idx) => {
              const callKey = `${preparedCall?.uniqueid}_${idx}`
              return (
                <div
                  key={callKey}
                  className='px-4'
                  // the dot of a new call goes away on a click in the row, or
                  // when the keyboard reaches one of its controls
                  onClick={() => handleClearNotification(preparedCall)}
                  onFocus={() => handleClearNotification(preparedCall)}
                >
                  <div
                    className={
                      idx === preparedCalls.length - 1
                        ? ''
                        : 'border-b border-borderLight dark:border-borderDark'
                    }
                  >
                    <LastCall
                      call={preparedCall}
                      showContactForm={showContactForm}
                      showCreateButton={canShowCreateButton(preparedCall)}
                    />
                  </div>
                </div>
              )
            })
          ) : (
            <EmptyList
              icon={EmptyResultIcon}
              text={t('LastCalls.No calls yet')}
            />
          )
        ) : (
          Array(3)
            .fill('')
            .map((_, idx) => {
              return (
                <div className='px-4' key={idx}>
                  <div
                    className={
                      idx === 2
                        ? ''
                        : 'border-b border-borderLight dark:border-borderDark'
                    }
                  >
                    <SkeletonRow />
                  </div>
                </div>
              )
            })
        )}
      </Scrollable>
    </>
  )
}
