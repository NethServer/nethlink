import { useStoreState } from "@renderer/store"
import { Account, AuthAppData, LoginPageData } from "@shared/types"
import { t } from "i18next"
import { DisplayedAccountLogin } from "./DisplayedAccountLogin"
import { NEW_ACCOUNT } from "@shared/constants"
import { AvailableAccountDeleteDialog } from "./AvailableAccountDeleteDialog"
import { useState } from "react"

export const AvailableAccountList = ({ handleDeleteAccount }: { handleDeleteAccount: (a: Account) => void }) => {
  const [auth] = useStoreState<AuthAppData>('auth')
  const [, setLoginData] = useStoreState<LoginPageData>('loginPageData')
  const handleSelectAccount = (account) => {
    setLoginData((p) => ({
      ...p,
      selectedAccount: account
    }))
  }

  return (
    <div className="w-full mt-7">
      <p className="text-titleLight dark:text-titleDark text-[20px] leading-[30px] font-medium mb-2">
        {t('Login.Account List title')}
      </p>
      <p className="text-titleLight dark:text-titleDark text-[14px] leading-5 mb-7">
        {t('Login.Account List description')}
      </p>
      <div className="max-h-60 overflow-y-auto">
        {Object.values(auth!.availableAccounts)!.map((account, idx) => {
          return (
            <DisplayedAccountLogin
              key={idx}
              account={account}
              imageSrc={account.data?.settings.avatar}
              handleClick={() => handleSelectAccount(account)}
              handleDeleteClick={() => handleDeleteAccount(account)}
            />
          )
        })}
      </div>
      <DisplayedAccountLogin handleClick={() => handleSelectAccount(NEW_ACCOUNT)} />
    </div>
  )
}

