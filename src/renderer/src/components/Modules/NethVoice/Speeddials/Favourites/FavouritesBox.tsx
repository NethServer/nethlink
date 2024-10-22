import { ModuleTitle } from "@renderer/components/ModuleTitle"
import { Scrollable } from "@renderer/components/Scrollable"
import { SkeletonRow } from "@renderer/components/SkeletonRow"
import { t } from "i18next"
import { useFavouriteModule } from "../hook/useFavouriteModule"
import { ContactNumber } from "../shared/ContactNumber"
import { EmptyList } from "@renderer/components/EmptyList"
import { faStar as FavouriteIcon } from '@fortawesome/free-solid-svg-icons'
import { FavouriteFilter } from "./FavouriteFilter"



export const FavouritesBox = () => {

  const { favourites } = useFavouriteModule()

  return (
    <>
      <ModuleTitle
        title={t('SpeedDial.Favourites')}
        actionComponent={<FavouriteFilter />}
      />
      <Scrollable
      >
        {favourites ? (
          favourites.length > 0 ? (
            favourites?.map((e, idx) => {
              return (
                <div key={idx} className="dark:hover:bg-hoverDark hover:bg-hoverLight w-full ">
                  <div className="px-5 w-full">
                    <div
                      className={`w-full ${idx === favourites.length - 1 ? `` : `border-b dark:border-borderDark border-borderLight`}`}
                    >
                      <ContactNumber
                        speedDial={e}
                        isFavouritePage={true}
                        isLastItem={favourites.length === 1 ? false : idx === favourites.length - 1}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <EmptyList icon={FavouriteIcon} text={t('SpeedDial.No favourites')} />
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
