import { ModuleTitle } from "@renderer/components/ModuleTitle"
import { Scrollable } from "@renderer/components/Scrollable"
import { useStoreState } from "@renderer/store"
import { Account, ParkingType } from "@shared/types"
import { t } from "i18next"
import { ParkedCall } from "./ParkedCall"
import { SkeletonRow } from "@renderer/components/SkeletonRow"
import { useEffect, useState } from "react"
import { log } from "@shared/utils/logger"
import { EmptyList } from "@renderer/components/EmptyList"
import {
  faSquareParking as ParkedCallIcon,
} from '@fortawesome/free-solid-svg-icons'
import { useParkingModule } from "./hook/useParkingModule"
import { ParkedCallSkeleton } from "./ParkedCallSkeleton"
import { useLoggedNethVoiceAPI } from "@renderer/hooks/useLoggedNethVoiceAPI"
import { isEmpty } from "lodash"

export const ParkingBox = () => {

  const { parkedCalls } = useParkingModule()
  const [account] = useStoreState<Account>('account')
  const { NethVoiceAPI } = useLoggedNethVoiceAPI()

  async function pickParking(parkingInfoDetails: any) {
    let parkingObjectInformations: any = {}
    if (!isEmpty(parkingInfoDetails) && !isEmpty(account?.data?.default_device)) {
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
      <Scrollable innerClassName={'min-w-[344px] mt-2'}>
        {parkedCalls ? (
          parkedCalls.length > 0 ? (
            parkedCalls?.map((e, idx) => {
              return (
                <div key={idx} className="dark:hover:bg-hoverDark hover:bg-hoverLight">
                  <div className="px-5">
                    <div
                      className={`${idx === parkedCalls.length - 1 ? `` : `border-b dark:border-borderDark border-borderLight`}`}
                    >
                      <ParkedCall
                        parkingDetails={e}
                        onPickup={pickParking}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <EmptyList icon={ParkedCallIcon} text={t('Parks.No parked call')} />
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
                  <ParkedCallSkeleton />
                </div>
              )
            })
        )}
      </Scrollable>
    </>
  )
}
