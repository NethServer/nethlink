import { useSharedState } from "@renderer/store"
import { isDev } from "@shared/utils/utils"
import { t } from "i18next"
import { truncate } from "lodash"

export const ProfileData = () => {
  const [account] = useSharedState('account')

  if (!account) return <>No account</>
  return (
    <div className="flex flex-col justify-center w-full h-[64px] py-3 px-4">
      <p className="dark:text-gray-400 text-gray-700">{t('TopBar.Signed in as')}</p>
      <div className="flex flex-row justify-between">
        <p className="dark:text-titleDark text-titleLight font-medium">
          {truncate(account.data?.name, { length: 20 })}
        </p>
        <p className="dark:text-gray-50 text-gray-700 font-normal">
          {account.data?.endpoints.mainextension[0].id}
        </p>
        {isDev() && (
          <p className="absolute top-0 right-0 dark:text-gray-50 text-gray-700 font-normal">
            [{account.data?.default_device.type}]
          </p>
        )}
      </div>
    </div>
  )
}
