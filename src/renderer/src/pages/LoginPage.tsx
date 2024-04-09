import { Account } from '@shared/types'
import classNames from 'classnames'
import { MutableRefObject, ReactNode, useEffect, useRef, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import spinner from '../assets/loginPageSpinner.svg'
import header from '../assets/loginPageHeader.svg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft as ArrowIcon,
  faEye as EyeIcon,
  faEyeSlash as EyeSlashIcon,
  faXmark as CrossIcon,
  faCircleXmark as ErrorIcon
} from '@fortawesome/free-solid-svg-icons'
import { TextInput } from '@renderer/components/Nethesis/TextInput'
import { DisplayedAccountLogin } from '@renderer/components/DisplayedAccountLogin'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { log } from '@shared/utils/logger'
import { t } from 'i18next'

type LoginData = {
  host: string
  username: string
  password: string
}

export function LoginPage() {
  const [displayedAccounts, setDisplayedAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | 'New Account'>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loginError, setLoginError] = useState<Error | undefined>(undefined)
  const [pwdVisible, setPwdVisible] = useState<boolean>(false)
  const windowHeight = useRef<number>(0)
  const loginWindowRef = useRef() as MutableRefObject<HTMLDivElement>

  useInitialize(() => {
    window.api.onLoadAccounts((accounts: Account[]) => {
      setDisplayedAccounts(accounts)
      log(windowHeight.current)
      setTimeout(() => {
        log(loginWindowRef.current?.clientHeight)
        windowHeight.current = loginWindowRef.current?.clientHeight || 0
      }, 250)
    })
  }, true)

  function resizeThisWindow(h: number) {
    windowHeight.current = h
    const finalH = h + (loginError ? 120 : 0)
    window.api.resizeLoginWindow(finalH)
  }

  function hideLoginWindow() {
    window.api.hideLoginWindow()
  }

  async function handleLogin(data: LoginData) {
    setLoginError(undefined)
    const hostReg =
      /^(?:(https?:\/\/)?([^:/$]{1,})(?::(\d{1,}))?(?:($|\/(?:[^?#]{0,}))?((?:\?(?:[^#]{1,}))?)?(?:(#(?:.*)?)?|$)))$/g
    const res = hostReg.exec(data.host)
    if (res) {
      const host = `${'https://'}${res[2]}`
      const [returnValue, err] = await window.api.login(host, data.username, data.password)
      setIsLoading(false)
      log(data, returnValue, err)
      if (err) {
        if (err.message === 'Unauthorized')
          setLoginError(new Error(t('Login.Wrong host or username or password')!))
        else setLoginError(err)
        setValue('host', data.host)
        setValue('username', data.username)
        setValue('password', data.password)
      } else {
        setSelectedAccount(undefined)
      }
    } else {
      setLoginError(new Error(t('Login.Wrong host or username or password')!))
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setFocus,
    formState: { errors }
  } = useForm<LoginData>({
    defaultValues: {
      host: '',
      username: '',
      password: ''
    }
  })
  const onSubmit: SubmitHandler<LoginData> = (data) => {
    handleLogin(data)
  }

  const focus = (selector: keyof LoginData) => {
    setTimeout(() => {
      setFocus(selector)
    }, 100)
  }

  const goBack = () => {
    setLoginError(undefined)
    setSelectedAccount(undefined)
  }
  useEffect(() => {
    if (selectedAccount) {
      if (selectedAccount === 'New Account') {
        resizeThisWindow(570)
        reset()
        focus('host')
      } else {
        resizeThisWindow(445)
        reset()
        setValue('host', selectedAccount.host)
        setValue('username', selectedAccount.username)
        focus('password')
      }
    } else {
      setLoginError(undefined)
      if (displayedAccounts.length === 1) {
        resizeThisWindow(375)
      } else if (displayedAccounts.length === 2) {
        resizeThisWindow(455)
      } else if (displayedAccounts.length >= 3) {
        resizeThisWindow(535)
      }
      focus('host')
    }
  }, [displayedAccounts, selectedAccount])

  const RenderError = () => {
    loginError && resizeThisWindow(windowHeight.current)
    return (
      !!loginError && (
        <div className="relative top-4 flex flex-col p-4 border-l-[3px] border-red-500 text-red-400 bg-red-950 rounded-md">
          <div className="flex flex-row items-center gap-2 ">
            <FontAwesomeIcon icon={ErrorIcon} className="" />
            <p>{t('Login.Login failed')}</p>
          </div>
          <p className="pl-6">{loginError?.message}</p>
        </div>
      )
    )
  }

  const newAccountForm: ReactNode = (
    <div className="mt-7">
      <p className="text-gray-900  dark:text-gray-100 text-xl font-semibold mb-3">
        {t('Login.New Account title')}
      </p>
      <p className="text-gray-900 dark:text-gray-100 text-md mb-8">
        {t('Login.New Account description')}
      </p>
      <div className="flex flex-col grow gap-7">
        <TextInput
          {...register('host')}
          type="text"
          label={t('Login.Host') as string}
          error={!!loginError || Boolean(errors.host)}
        />
        <TextInput
          {...register('username')}
          type="text"
          label={t('Login.Username') as string}
          error={!!loginError || Boolean(errors.username)}
        />
        <TextInput
          {...register('password')}
          label={t('Login.Password') as string}
          error={!!loginError || Boolean(errors.password)}
          type={pwdVisible ? 'text' : 'password'}
          icon={pwdVisible ? EyeIcon : EyeSlashIcon}
          onIconClick={() => setPwdVisible(!pwdVisible)}
          trailingIcon={true}
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-gray-50 dark:text-gray-900 rounded h-9 font-semibold mt-2 cursor-pointer"
        >
          {t('Login.Sign in')}
        </button>
        <RenderError />
      </div>
    </div>
  )

  return (
    <div
      className="h-[100vh] w-[100vw] bg-gray-50 dark:bg-gray-900 relative p-8 rounded-[10px]"
      ref={loginWindowRef}
    >
      <div className={classNames('h-full w-full', isLoading ? 'brightness-50' : '')}>
        <div className="flex flex-row justify-between items-end">
          <img src={header}></img>
          {displayedAccounts.length > 0 && selectedAccount && (
            <FontAwesomeIcon
              icon={ArrowIcon}
              className="h-5 w-5 dark:text-gray-50 ml-12 cursor-pointer"
              onClick={goBack}
            />
          )}
          <FontAwesomeIcon
            icon={CrossIcon}
            className="h-5 w-5 dark:text-gray-50 cursor-pointer"
            onClick={() => hideLoginWindow()}
          />
        </div>
        <form
          onSubmit={async (e) => {
            setLoginError(undefined)
            setIsLoading(true)
            e.preventDefault()
            setTimeout(() => {
              handleSubmit(onSubmit)(e)
            }, 100)
          }}
        >
          {
            //quando esiste almeno un account allora mostro la lista di selezione
            displayedAccounts.length > 0 ? (
              <div>
                {selectedAccount ? (
                  <div>
                    {selectedAccount === 'New Account' ? (
                      newAccountForm
                    ) : (
                      <div className="w-full mt-7">
                        <p className="text-gray-900 dark:text-gray-100 text-xl font-semibold mb-3">
                          {t('Login.Account List title')}
                        </p>
                        <p className="text-gray-900 dark:text-gray-100 text-md mb-5">
                          {t('Login.Account List description')}
                        </p>
                        <DisplayedAccountLogin
                          account={selectedAccount}
                          imageSrc={selectedAccount.data?.settings.avatar}
                        />
                        <TextInput
                          {...register('password')}
                          label={t('Login.Password') as string}
                          error={!!loginError || Boolean(errors.password)}
                          className="mt-5"
                          type={pwdVisible ? 'text' : 'password'}
                          icon={pwdVisible ? EyeIcon : EyeSlashIcon}
                          onIconClick={() => setPwdVisible(!pwdVisible)}
                          trailingIcon={true}
                        />
                        <button
                          type="submit"
                          className="w-full bg-blue-500 text-gray-50 dark:text-gray-900 rounded h-9 font-semibold mt-7 cursor-pointer"
                        >
                          {t('Login.Sign in')}
                        </button>
                        <RenderError />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full mt-7">
                    <p className="text-gray-900 dark:text-gray-100 text-xl font-semibold mb-3">
                      {t('Login.Account List title')}
                    </p>
                    <p className="text-gray-900 dark:text-gray-100 text-md mb-8">
                      {t('Login.Account List description')}
                    </p>
                    <div className="max-h-60 overflow-y-auto">
                      {displayedAccounts.map((account, idx) => {
                        return (
                          <DisplayedAccountLogin
                            key={idx}
                            account={account}
                            imageSrc={account.data?.settings.avatar}
                            handleClick={() => setSelectedAccount(account)}
                          />
                        )
                      })}
                    </div>
                    <DisplayedAccountLogin handleClick={() => setSelectedAccount('New Account')} />
                  </div>
                )}
              </div>
            ) : (
              //altrimenti mostro la finestra per la creazione del primo account
              newAccountForm
            )
          }
        </form>
      </div>
      {isLoading && (
        <div className="absolute top-0 left-0 bg-trasparent h-full w-full select-none flex items-center justify-center">
          <img src={spinner} className="animate-spin"></img>
        </div>
      )}
    </div>
  )
}
