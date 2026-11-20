import { ModuleTitle } from '@renderer/components/ModuleTitle'
import { Scrollable } from '@renderer/components/Scrollable'
import { useSharedState } from '@renderer/store'
import { t } from 'i18next'
import { ParkedCall } from './ParkedCall'
import { EmptyList } from '@renderer/components/EmptyList'
import { faSquareParking as ParkedCallIcon } from '@fortawesome/free-solid-svg-icons'
import { useParkingModule } from './hook/useParkingModule'
import { ParkedCallSkeleton } from './ParkedCallSkeleton'
import { useLoggedNethVoiceAPI } from '@renderer/hooks/useLoggedNethVoiceAPI'
import { isEmpty } from 'lodash'

export const ParkingBox = () => {
  const { parkedCalls } = useParkingModule()
  const [account] = useSharedState('account')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  async function pickParking(parkingInfoDetails: any) {
    let parkingObjectInformations: any = {}
    if (
      !isEmpty(parkingInfoDetails) &&
      !isEmpty(account?.data?.default_device)
    ) {
      parkingObjectInformations = {
        parking: parkingInfoDetails?.parking,
        destId: account?.data?.default_device?.id,
      }
    }
    if (!isEmpty(parkingObjectInformations)) {
      try {
        await NethVoiceAPI.AstProxy.pickupParking(parkingObjectInformations)
      } catch (error) {
        console.error(error)
      }
    }
  }

  return (
    <>
      <ModuleTitle
        title={`${t('Parks.Parking')} ${parkedCalls && parkedCalls.length > 0 ? `(${parkedCalls.length})` : ''}`}
      />
      <Scrollable>
        {parkedCalls ? (
          parkedCalls.length > 0 ? (
            parkedCalls?.map((e, idx) => {
              return (
                <div key={idx} className='px-4'>
                  <div
                    className={
                      idx === parkedCalls.length - 1
                        ? ''
                        : 'border-b border-borderLight dark:border-borderDark'
                    }
                  >
                    <ParkedCall parkingDetails={e} onPickup={pickParking} />
                  </div>
                </div>
              )
            })
          ) : (
            <EmptyList
              icon={ParkedCallIcon}
              text={t('Parks.No parked calls')}
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
                    <ParkedCallSkeleton />
                  </div>
                </div>
              )
            })
        )}
      </Scrollable>
    </>
  )
}
