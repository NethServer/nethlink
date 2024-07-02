import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, SubmitHandler, FieldErrors } from 'react-hook-form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEye as EyeIcon,
  faEyeSlash as EyeSlashIcon,
  faXmarkCircle as ErrorIcon
} from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, TextInput } from '@renderer/components/Nethesis'
import { Account, AuthAppData, LoginData, LoginPageData } from '@shared/types'
import { DisplayedAccountLogin } from './DisplayedAccountLogin'
import { useStoreState } from '@renderer/store'
import { useNethVoiceAPI } from '@shared/useNethVoiceAPI'
import { IPC_EVENTS, NEW_ACCOUNT } from '@shared/constants'
import { log } from '@shared/utils/logger'
import { useLogin } from '@shared/useLogin'
import { useNetwork } from '@shared/useNetwork'

export interface LoginFormProps {
  onError: (formErrors: FieldErrors<LoginData>, generalError: Error | undefined) => void
}
export const LoginForm = ({
  onError
}) => {
  const { NethVoiceAPI } = useNethVoiceAPI()
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const [auth] = useStoreState<AuthAppData>('auth')
  const [account, setAccount] = useStoreState<Account>('account')
  const [pwdVisible, setPwdVisible] = useState<boolean>(false)
  const [loginData, setLoginData] = useStoreState<LoginPageData>('loginPageData')
  const [error, setError] = useState<Error | undefined>(undefined)

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
      // host: 'https://cti.demo-heron.sf.nethserver.net',
      // username: 'lorenzo',
      // password: 'NethVoice,1234'
    },
    resolver: zodResolver(schema)
  })

  useEffect(() => {
    onError(errors, error)
  }, [Object.keys(errors).length, error])

  const setIsLoading = (value: boolean) => {
    setLoginData((p) => ({
      ...p,
      isLoading: value
    }))
  }

  useEffect(() => {
    setIsLoading(false)
    if (auth?.availableAccounts) {
      if (loginData?.selectedAccount) {
        if (loginData.selectedAccount === NEW_ACCOUNT) {
          reset()
          focus('host')
        } else {
          reset()
          setValue('host', loginData.selectedAccount.host)
          setValue('username', loginData.selectedAccount.username)
          focus('password')
        }
      } else {
        setError(undefined)
        focus('host')
      }
    }
  }, [auth, loginData?.selectedAccount])

  async function handleLogin(data: LoginData) {
    if (!loginData?.isLoading) {
      let e: Error | undefined = undefined
      setError(() => e)
      setIsLoading(true)
      const hostReg =
        /^(?:(https?:\/\/)?([^:/$]{1,})(?::(\d{1,}))?(?:($|\/(?:[^?#]{0,}))?((?:\?(?:[^#]{1,}))?)?(?:(#(?:.*)?)?|$)))$/g
      const res = hostReg.exec(data.host)
      if (res) {
        try {
          const loggedAccount = await NethVoiceAPI.Authentication.login(
            res[2],
            data.username,
            data.password
          )
          window.electron.send(IPC_EVENTS.GET_NETHVOICE_CONFIG, loggedAccount)
          window.electron.receive(IPC_EVENTS.SET_NETHVOICE_CONFIG, (account) => {
            setAccount(() => account)
            window.electron.send(IPC_EVENTS.LOGIN, data.password)
          })

          setFormValues({
            host: '',
            password: '',
            username: ''
          })
          setError(() => undefined)
        } catch (error: any) {
          setIsLoading(false)
          if (error.message === 'Unauthorized')
            setError(() => new Error(t('Login.Wrong host or username or password')!))
          else setError(() => error)
          //setFormValues(data)
        }
      } else {
        setIsLoading(false)
        setFormValues(data)
        setError(() => new Error(t('Login.Wrong host or username or password')!))
      }
    }
  }

  const onSubmitForm: SubmitHandler<LoginData> = (data) => {
    handleLogin(data)
  }

  function setFormValues(data: LoginData) {
    setValue('host', data.host)
    setValue('username', data.username)
    setValue('password', data.password)
  }

  const focus = (selector: keyof LoginData) => {
    setTimeout(() => {
      setFocus(selector)
    }, 100)
  }

  const RenderError = () => {
    return (
      !!error && (
        <div className="relative flex flex-col p-4 border-l-[3px] border-rose-500 dark:border-rose-400 bg-rose-100 dark:bg-rose-900 rounded-md mb-8">
          <div className="flex flex-row items-center gap-2">
            <FontAwesomeIcon icon={ErrorIcon} className="text-red-700 dark:text-rose-100" />
            <p className="font-medium text-[14px] leading-5 text-red-800 dark:text-rose-100">
              {t('Login.Login failed')}
            </p>
          </div>
          <p className="pl-6 font-normal text-[14px] leading-5 text-rose-700 dark:text-rose-200">
            {error?.message}
          </p>
        </div>
      )
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      <div className="mt-7">
        <p className="text-titleLight  dark:text-titleDark text-[20px] leading-[30px] font-medium mb-2">
          {loginData?.selectedAccount
            ? t('Login.Account List title')
            : t('Login.New Account title')}
        </p>
        <p className="text-titleLight dark:text-titleDark text-[14px] leading-5 mb-7">
          {loginData?.selectedAccount
            ? t('Login.Account List description')
            : t('Login.New Account description')}
        </p>
        <RenderError />
        <div className="flex flex-col gap-7">
          {loginData?.selectedAccount && loginData.selectedAccount !== NEW_ACCOUNT ? (
            <DisplayedAccountLogin
              account={loginData.selectedAccount}
              imageSrc={loginData.selectedAccount.data?.settings.avatar}
            />
          ) : (
            <>
              <TextInput
                {...register('host')}
                type="text"
                label={t('Login.Host') as string}
                helper={errors.host?.message || undefined}
                error={!!errors.host?.message}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submitButtonRef.current?.focus()
                    handleSubmit(onSubmitForm)(e)
                  }
                }}
              />
              <TextInput
                {...register('username')}
                type="text"
                label={t('Login.Username') as string}
                helper={errors.username?.message || undefined}
                error={!!errors.username?.message}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submitButtonRef.current?.focus()
                    handleSubmit(onSubmitForm)(e)
                  }
                }}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitButtonRef.current?.focus()
                handleSubmit(onSubmitForm)(e)
              }
            }}
          />
          <Button ref={submitButtonRef} type="submit" variant="primary">
            {t('Login.Sign in')}
          </Button>
        </div>
      </div>
    </form>
  )
}
