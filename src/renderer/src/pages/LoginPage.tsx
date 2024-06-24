import { AuthAppData, LoginPageData } from '@shared/types'
import classNames from 'classnames'
import { MutableRefObject, useEffect, useRef } from 'react'
import spinner from '../assets/loginPageSpinner.svg'
import darkHeader from '../assets/nethlinkDarkHeader.svg'
import lightHeader from '../assets/nethlinkLightHeader.svg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft as ArrowIcon,
  faXmark as CrossIcon,
} from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import { Button } from '@renderer/components/Nethesis'

import './LoginPage.css'
import { useStoreState } from '@renderer/store'
import { AvailableAccountList, LoginForm } from '@renderer/components/pageComponents'

export interface LoginPageProps {
  themeMode: string
}



export function LoginPage({ themeMode }: LoginPageProps) {


  const [auth] = useStoreState<AuthAppData>('auth')
  const loginWindowRef = useRef() as MutableRefObject<HTMLDivElement>
  const [loginData, setLoginData] = useStoreState<LoginPageData>('loginPageData')

  useEffect(() => {
    if (loginData) {
      window.api.resizeLoginWindow(loginData.windowHeight || 570)
    }
  }, [loginData?.windowHeight])

  function exitLoginWindow() {
    window.api.exitNethLink()
  }

  const goBack = () => {
    setLoginData((p) => ({
      ...p,
      error: undefined,
      selectedAccount: undefined
    }))
  }

  return (
    <div
      className="draggableAnchor h-[100vh] w-[100vw] bg-bgLight dark:bg-bgDark relative p-8 rounded-[10px] text-sm hide-scrollbar"
      ref={loginWindowRef}
    >
      <div className={classNames('noDraggableAnchor', 'h-full w-full')}>
        <div className="flex flex-row justify-between items-center">
          <img src={themeMode === 'dark' ? darkHeader : lightHeader} className="h-10"></img>
          <Button variant="ghost" className="pt-2 pr-1 pb-2 pl-1">
            <FontAwesomeIcon
              icon={CrossIcon}
              className="h-5 w-5 dark:text-gray-50 text-gray-900"
              onClick={() => exitLoginWindow()}
            />
          </Button>
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
            {auth.isFirstStart || loginData?.selectedAccount ? <LoginForm /> : <AvailableAccountList />}
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
