import { AuthAppData, LoginData, LoginPageData } from '@shared/types'
import classNames from 'classnames'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import spinner from '../assets/loginPageSpinner.svg'
import darkHeader from '../assets/nethlinkDarkHeader.svg'
import lightHeader from '../assets/nethlinkLightHeader.svg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft as ArrowIcon,
} from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import { Button } from '@renderer/components/Nethesis'

import './LoginPage.css'
import { useStoreState } from '@renderer/store'
import { AvailableAccountList, LoginForm } from '@renderer/components/pageComponents'
import { NEW_ACCOUNT } from '@shared/constants'
import { log } from '@shared/utils/logger'
import { FieldErrors } from 'react-hook-form'

export interface LoginPageProps {
  themeMode: string
}

enum LoginSizes {
  BASE = 550,
  ACCOUNT_FORM = 488,
  BACK_BUTTON = 60,
  INPUT_ERROR = 22,
  LOGIN_FAILURE = 104,
  ONE_ACCOUNT = 375,
  TWO_ACCOUNT = 455,
  MULTIPLE_ACCOUNT = 535,
  CONNECTION_FAILURE_NO_ACCOUNTS = 380,
  CONNECTION_FAILURE_ON_ACCOUNT_FORM = 500,
  CONNECTION_FAILURE_BASE = 388
}

type ErrorsData = {
  formErrors: FieldErrors<LoginData>,
  generalError: Error | undefined
}
export function LoginPage({ themeMode }: LoginPageProps) {


  const [auth] = useStoreState<AuthAppData>('auth')
  const loginWindowRef = useRef() as MutableRefObject<HTMLDivElement>
  const [loginData, setLoginData] = useStoreState<LoginPageData>('loginPageData')
  const [connection] = useStoreState<boolean>('connection')
  const [errorsData, setErrorsData] = useState<ErrorsData>()

  useEffect(() => {
    let loginWindowHeight = 0
    const accounts = Object.keys(auth?.availableAccounts || {})
    const errorCount = Object.values(errorsData?.formErrors || {}).filter((v) => v.message).length
    //Login form is shown
    if (loginData?.selectedAccount) {
      if (loginData.selectedAccount === NEW_ACCOUNT) {
        loginWindowHeight = LoginSizes.BASE
        if (!connection)
          loginWindowHeight = LoginSizes.CONNECTION_FAILURE_BASE
        if (!auth?.isFirstStart) {
          loginWindowHeight += LoginSizes.BACK_BUTTON - 24
        }
      } else {
        loginWindowHeight = LoginSizes.ACCOUNT_FORM
        if (!connection)
          loginWindowHeight = LoginSizes.CONNECTION_FAILURE_ON_ACCOUNT_FORM
      }
    } else {
      //List of account is shown
      switch (accounts.length) {
        case 0:
          loginWindowHeight = LoginSizes.BASE
          if (!auth?.isFirstStart) {
            loginWindowHeight += LoginSizes.BACK_BUTTON
          }
          break
        case 1:
          loginWindowHeight = LoginSizes.ONE_ACCOUNT
          break
        case 2:
          loginWindowHeight = LoginSizes.TWO_ACCOUNT
          break
        default:
          loginWindowHeight = LoginSizes.MULTIPLE_ACCOUNT
          break
      }
      if (!connection)
        loginWindowHeight = LoginSizes.CONNECTION_FAILURE_NO_ACCOUNTS
    }
    loginWindowHeight += LoginSizes.INPUT_ERROR * errorCount
    if (errorsData?.generalError) {
      loginWindowHeight += LoginSizes.LOGIN_FAILURE
    }
    log({ loginWindowHeight })
    setLoginData((p) => ({
      ...p,
      windowHeight: loginWindowHeight
    }))
  }, [loginData?.selectedAccount, auth, errorsData])

  useEffect(() => {
    if (loginData) {
      window.api.resizeLoginWindow(loginData.windowHeight || 0)
    }
  }, [loginData?.windowHeight])

  const goBack = () => {
    setLoginData((p) => ({
      ...p,
      error: undefined,
      selectedAccount: undefined
    }))
    setErrorsData({ formErrors: {}, generalError: undefined })
  }


  const onFormErrors = (formErrors: FieldErrors<LoginData>, generalError: Error | undefined) => {
    setErrorsData({
      formErrors,
      generalError
    })
  }

  return (
    <div
      className="draggableAnchor h-[100vh] w-[100vw] bg-bgLight dark:bg-bgDark relative p-8 text-sm hide-scrollbar"
      ref={loginWindowRef}
    >
      <div className={classNames('noDraggableAnchor', 'h-full w-full')}>
        <div className="flex flex-row justify-between items-center">
          <img src={themeMode === 'dark' ? darkHeader : lightHeader} className="h-10"></img>
        </div>
        {
          auth && <>
            {
              Object.keys(auth.availableAccounts).length > 0 && loginData?.selectedAccount && (
                <Button
                  variant="ghost"
                  className="flex gap-3 items-center pt-2 pr-1 pb-2 pl-1 mt-6"
                  onClick={goBack}
                >
                  <FontAwesomeIcon
                    icon={ArrowIcon}
                    className="h-5 w-5 dark:text-textBlueDark text-textBlueLight"
                  />
                  <p className="dark:text-textBlueDark text-textBlueLight font-medium">
                    {t('Login.Back')}
                  </p>
                </Button>
              )}
            {auth.isFirstStart || loginData?.selectedAccount ? <LoginForm onError={onFormErrors} /> : <AvailableAccountList />}
          </>
        }
      </div>
      {loginData?.isLoading && (
        <div className="absolute top-0 left-0 bg-spinnerBgLight dark:bg-spinnerBgDark bg-opacity-75 dark:bg-opacity-75 h-full w-full select-none flex items-center justify-center rounded-[10px] z-[1000]">
          <img src={spinner} className="animate-spin"></img>
        </div>
      )}
    </div>
  )
}
