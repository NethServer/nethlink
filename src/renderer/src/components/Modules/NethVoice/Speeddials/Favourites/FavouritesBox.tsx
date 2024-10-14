import { ModuleTitle } from "@renderer/components/ModuleTitle"
import { Scrollable } from "@renderer/components/Scrollable"
import { SkeletonRow } from "@renderer/components/SkeletonRow"
import { useStoreState } from "@renderer/store"
import { ContactType } from "@shared/types"
import { t } from "i18next"
import { useFavouriteModule } from "../hook/useFavouriteModule"
import { ContactNumber } from "../shared/ContactNumber"
import { usePhoneIslandEventHandler } from "@renderer/hooks/usePhoneIslandEventHandler"
import { EmptyList } from "@renderer/components/EmptyList"
import { faStar as FavouriteIcon } from '@fortawesome/free-solid-svg-icons'

export const FavouritesBox = () => {

  const { favourites } = useFavouriteModule()
  const { callNumber } = usePhoneIslandEventHandler()

  return (
    <>
      <ModuleTitle
        title={t('Favourites.Module title')}
      />
      <Scrollable >
        {favourites ? (
          favourites.length > 0 ? (
            favourites?.map((e, idx) => {
              return (
                <div key={idx} className="dark:hover:bg-hoverDark hover:bg-hoverLight">
                  <div className="px-5">
                    <div
                      className={`${idx === favourites.length - 1 ? `` : `border-b dark:border-borderDark border-borderLight`}`}
                    >
                      <ContactNumber
                        speedDial={e}
                        callUser={() => callNumber(e.speeddial_num!)}
                        isLastItem={favourites.length === 1 ? false : idx === favourites.length - 1}
                        isFavourite={true}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <EmptyList icon={FavouriteIcon} text={t('SpeedDial.No speed dials')} />
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
