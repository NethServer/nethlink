import { Account } from '@shared/types'
import classNames from 'classnames'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import spinner from '../assets/loginPageSpinner.svg'
import darkHeader from '../assets/nethlinkDarkHeader.svg'
import lightHeader from '../assets/nethlinkLightHeader.svg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft as ArrowIcon,
  faEye as EyeIcon,
  faEyeSlash as EyeSlashIcon,
  faXmark as CrossIcon,
  faXmarkCircle as ErrorIcon
} from '@fortawesome/free-solid-svg-icons'
import { TextInput } from '@renderer/components/Nethesis/TextInput'
import { DisplayedAccountLogin } from '@renderer/components/DisplayedAccountLogin'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { log } from '@shared/utils/logger'
import { t } from 'i18next'
import { Button } from '@renderer/components/Nethesis'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

export interface LoginPageProps {
  themeMode: string
}

type LoginData = {
  host: string
  username: string
  password: string
}

const NEW_ACCOUNT = 'New Account'

export function LoginPage({ themeMode }: LoginPageProps) {
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | typeof NEW_ACCOUNT>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loginError, setLoginError] = useState<Error | undefined>(undefined)
  const [pwdVisible, setPwdVisible] = useState<boolean>(false)
  const windowHeight = useRef<number>(0)
  const loginWindowRef = useRef() as MutableRefObject<HTMLDivElement>

  const schema: z.ZodType<LoginData> = z.object({
    host: z
      .string()
      .trim()
      .min(1, `${t('Common.This field is required')}`),
    username: z
      .string()
      .trim()
      .min(1, `${t('Common.This field is required')}`),
    password: z
      .string()
      .trim()
      .min(1, `${t('Common.This field is required')}`)
  })

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
    },
    resolver: zodResolver(schema)
  })

  useInitialize(() => {
    window.api.onLoadAccounts((accounts: Account[]) => {
      setAvailableAccounts(accounts)
      log(windowHeight.current)
      setTimeout(() => {
        log(loginWindowRef.current?.clientHeight)
        windowHeight.current = loginWindowRef.current?.clientHeight || 0
      }, 250)
    })
  }, true)

  function resizeThisWindow(h: number) {
    windowHeight.current = h
    const finalH = h + (loginError ? 100 : 0)
    window.api.resizeLoginWindow(finalH)
  }

  function hideLoginWindow() {
    window.api.hideLoginWindow()
  }

  function setFormValues(data: LoginData) {
    setValue('host', data.host)
    setValue('username', data.username)
    setValue('password', data.password)
  }

  async function handleLogin(data: LoginData) {
    setLoginError(undefined)
    if (selectedAccount === NEW_ACCOUNT) {
      window.api.resizeLoginWindow(620)
    } else window.api.resizeLoginWindow(515)

    const hostReg =
      /^(?:(https?:\/\/)?([^:/$]{1,})(?::(\d{1,}))?(?:($|\/(?:[^?#]{0,}))?((?:\?(?:[^#]{1,}))?)?(?:(#(?:.*)?)?|$)))$/g
    const res = hostReg.exec(data.host)
    if (res) {
      setIsLoading(true)
      const host = `${'https://'}${res[2]}`
      window.api
        .login(host, data.username, data.password)
        .catch((error) => {
          setFormValues(data)
          if (error.message === 'Unauthorized')
            setLoginError(new Error(t('Login.Wrong host or username or password')!))
          else setLoginError(error)
        })
        .finally(() => setIsLoading(false))
    } else {
      setLoginError(new Error(t('Login.Wrong host or username or password')!))
      setFormValues(data)
    }
  }

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
      if (selectedAccount === NEW_ACCOUNT) {
        resizeThisWindow(620)
        reset()
        focus('host')
      } else {
        resizeThisWindow(515)
        reset()
        setValue('host', selectedAccount.host)
        setValue('username', selectedAccount.username)
        focus('password')
      }
    } else {
      setLoginError(undefined)
      if (availableAccounts.length === 1) {
        resizeThisWindow(375)
      } else if (availableAccounts.length === 2) {
        resizeThisWindow(455)
      } else if (availableAccounts.length >= 3) {
        resizeThisWindow(535)
      }
      focus('host')
    }
  }, [availableAccounts, selectedAccount])

  const RenderError = () => {
    loginError && resizeThisWindow(windowHeight.current)
    return (
      !!loginError && (
        <div className="relative flex flex-col p-4 border-l-[3px] border-rose-400 text-red-100 bg-rose-900 rounded-md mb-8">
          <div className="flex flex-row items-center gap-2 ">
            <FontAwesomeIcon icon={ErrorIcon} />
            <p>{t('Login.Login failed')}</p>
          </div>
          <p className="pl-6">{loginError?.message}</p>
        </div>
      )
    )
  }

  const isFirstLogin = availableAccounts.length === 0

  const DisplayAvailableAccount = () => {
    return (
      <div className="w-full mt-7">
        <p className="text-gray-900 dark:text-gray-100 text-xl font-semibold mb-3">
          {t('Login.Account List title')}
        </p>
        <p className="text-gray-900 dark:text-gray-100 text-md mb-8">
          {t('Login.Account List description')}
        </p>
        <div className="max-h-60 overflow-y-auto">
          {availableAccounts.map((account, idx) => {
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
        <DisplayedAccountLogin handleClick={() => setSelectedAccount(NEW_ACCOUNT)} />
      </div>
    )
  }

  /* TODO rendere tutti questi componenti dei veri componenti */
  const LoginForm = (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit(onSubmit)(e)
      }}
    >
      <div className="mt-7">
        <p className="text-gray-900  dark:text-gray-100 text-xl font-semibold mb-3">
          {selectedAccount ? t('Login.Account List title') : t('Login.New Account title')}
        </p>
        <p className="text-gray-900 dark:text-gray-100 text-md mb-8">
          {selectedAccount
            ? t('Login.Account List description')
            : t('Login.New Account description')}
        </p>
        <RenderError />
        <div className="flex flex-col gap-7">
          {selectedAccount && selectedAccount !== NEW_ACCOUNT ? (
            <DisplayedAccountLogin
              account={selectedAccount}
              imageSrc={selectedAccount.data?.settings.avatar}
            />
          ) : (
            <>
              <TextInput
                {...register('host')}
                type="text"
                label={t('Login.Host') as string}
                helper={errors.host?.message || undefined}
                error={!!errors.host?.message}
              />
              <TextInput
                {...register('username')}
                type="text"
                label={t('Login.Username') as string}
                helper={errors.username?.message || undefined}
                error={!!errors.username?.message}
              />
            </>
          )}
          <TextInput
            {...register('password')}
            label={t('Login.Password') as string}
            type={pwdVisible ? 'text' : 'password'}
            icon={pwdVisible ? EyeIcon : EyeSlashIcon}
            onIconClick={() => setPwdVisible(!pwdVisible)}
            trailingIcon={true}
            helper={errors.password?.message || undefined}
            error={!!errors.password?.message}
          />
          <button
            type="submit"
            className={`w-full dark:bg-blue-500 bg-blue-700 text-gray-50 dark:text-gray-900 rounded h-9 font-semibold cursor-pointer`}
          >
            {t('Login.Sign in')}
          </button>
        </div>
      </div>
    </form>
  )

  return (
    <div
      className="h-[100vh] w-[100vw] bg-gray-50 dark:bg-gray-900 relative p-8 rounded-[10px] text-sm"
      ref={loginWindowRef}
    >
      <div className={classNames('h-full w-full')}>
        <div className="flex flex-row justify-between items-center">
          <img src={themeMode === 'dark' ? darkHeader : lightHeader} className="h-10"></img>
          <FontAwesomeIcon
            icon={CrossIcon}
            className="h-5 w-5 dark:text-gray-50 cursor-pointer"
            onClick={() => hideLoginWindow()}
          />
        </div>
        {availableAccounts.length > 0 && selectedAccount && (
          <Button
            className="flex gap-3 items-center pt-0 pr-0 pb-0 pl-0 mt-10 dark:hover:bg-gray-700 hover:bg-gray-200"
            onClick={goBack}
          >
            <FontAwesomeIcon
              icon={ArrowIcon}
              className="h-5 w-5 cursor-pointer dark:text-blue-500 text-blue-600"
            />
            <p className="dark:text-blue-500 text-blue-600 font-semibold">{t('Login.Back')}</p>
          </Button>
        )}
        {isFirstLogin || selectedAccount ? LoginForm : <DisplayAvailableAccount />}
      </div>
      {isLoading && (
        <div className="absolute top-0 left-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-80 h-full w-full select-none flex items-center justify-center z-[1000]">
          <img src={spinner} className="animate-spin"></img>
        </div>
      )}
    </div>
  )
}
