import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, SubmitHandler, FieldErrors } from 'react-hook-form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEye as EyeIcon,
  faEyeSlash as EyeSlashIcon,
  faXmarkCircle as ErrorIcon,
  faWarning as AlertIcon,
} from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import { useEffect, useRef, useState } from 'react'
import { Button, TextInput } from '@renderer/components/Nethesis'
import { Account, LoginData } from '@shared/types'
import { DisplayedAccountLogin } from './DisplayedAccountLogin'
import { useLoginPageData, useSharedState } from '@renderer/store'
import { useNethVoiceAPI } from '@shared/useNethVoiceAPI'
import { IPC_EVENTS, NEW_ACCOUNT } from '@shared/constants'
import { Log } from '@shared/utils/logger'
import { getAccountUID } from '@shared/utils/utils'
import { InlineNotification } from '@renderer/components/Nethesis/InlineNotification'

export interface LoginFormProps {
  onError: (
    formErrors: FieldErrors<LoginData>,
    generalError: Error | undefined,
  ) => void
  handleRefreshConnection: () => void
}
export const LoginForm = ({ onError, handleRefreshConnection }) => {
  const { NethVoiceAPI } = useNethVoiceAPI()
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const [auth] = useSharedState('auth')
  const [pwdVisible, setPwdVisible] = useState<boolean>(false)
  const [selectedAccount] = useLoginPageData('selectedAccount')
  const [isLoading, setIsLoading] = useLoginPageData('isLoading')
  const [connection] = useSharedState('connection')
  const [error, setError] = useState<Error | undefined>(undefined)
  const passwordRef = useRef<string>()

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
      .min(1, `${t('Common.This field is required')}`),
  })

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<LoginData>({
    defaultValues: {},
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    onError(errors, error)
  }, [Object.keys(errors).length, error])

  useEffect(() => {
    setIsLoading(false)
    if (auth?.availableAccounts) {
      if (selectedAccount) {
        if (selectedAccount === NEW_ACCOUNT) {
          reset()
          focus('host')
        } else {
          reset()
          setValue('host', selectedAccount.host)
          setValue('username', selectedAccount.username)
          focus('password')
        }
      } else {
        setError(undefined)
        focus('host')
      }
    }
  }, [auth, selectedAccount])

  async function handleLogin(data: LoginData) {
    if (!isLoading) {
      let e: Error | undefined = undefined
      setError(() => e)
      setIsLoading(true)
      const hostReg =
        /^(?:(https?:\/\/)?([^:/$]{1,})(?::(\d{1,}))?(?:($|\/(?:[^?#]{0,}))?((?:\?(?:[^#]{1,}))?)?(?:(#(?:.*)?)?|$)))$/g
      const res = hostReg.exec(data.host)
      if (res) {
        try {
          Log.info('LOGIN try login with credential')
          const loggedAccount = await NethVoiceAPI.Authentication.login(
            res[2],
            data.username,
            data.password,
          )
          Log.info('LOGIN successfully logged in with credential')
          window.electron.receive(
            IPC_EVENTS.SET_NETHVOICE_CONFIG,
            (account: Account) => {
              passwordRef.current = data.password
              Log.info('LOGIN received account server configuration', account)
              const previousLoggedAccount =
                auth?.availableAccounts[getAccountUID(account)]
              account.theme = previousLoggedAccount
                ? previousLoggedAccount.theme
                : 'system'
              Log.info('LOGIN send login event to the backend', account)
              window.electron.send(IPC_EVENTS.LOGIN, {
                password: passwordRef.current,
                account,
              })
            },
          )
          Log.info('LOGIN get account server configuration')
          window.electron.send(IPC_EVENTS.GET_NETHVOICE_CONFIG, loggedAccount)

          setFormValues({
            host: '',
            password: '',
            username: '',
          })
          setError(() => undefined)
        } catch (error: any) {
          setIsLoading(false)
          if (error.message === 'Unauthorized')
            setError(
              () => new Error(t('Login.Wrong host or username or password')!),
            )
          else {
            setError(() => error)
          }
        }
      } else {
        setIsLoading(false)
        setFormValues(data)
        setError(
          () => new Error(t('Login.Wrong host or username or password')!),
        )
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

  const RenderConnectionError = ({ handleRefreshConnection }) => {
    return (
      <div>
        <div className='relative flex flex-col p-4 border-l-[3px] border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900 rounded-md mb-8'>
          <div className='flex flex-row items-center gap-2'>
            <FontAwesomeIcon
              icon={AlertIcon}
              className='text-amber-700 dark:text-amber-50'
            />
            <p className='font-medium text-[14px] leading-5 text-amber-800 dark:text-amber-100'>
              {t('Common.No internet connection title')}
            </p>
          </div>
          <p className='pl-6 font-normal text-[14px] leading-5 text-amber-700 dark:text-amber-100'>
            {t('Common.No internet connection description')}
          </p>
        </div>
        <Button
          variant='white'
          className='w-full'
          onClick={handleRefreshConnection}
        >
          {t('Common.Refresh')}
        </Button>
      </div>
    )
  }

  return (
    <div className='mt-7'>
      <p className='text-titleLight  dark:text-titleDark text-[20px] leading-[30px] font-medium mb-2'>
        {selectedAccount
          ? t('Login.Account List title')
          : t('Login.New Account title')}
      </p>
      <p className='text-titleLight dark:text-titleDark text-[14px] leading-5 mb-7'>
        {selectedAccount
          ? t('Login.Account List description')
          : t('Login.New Account description')}
      </p>
      {error && (
        <InlineNotification type='error' title={t('Login.Login failed')}>
          {error.message}
        </InlineNotification>
      )}
      {selectedAccount && selectedAccount !== NEW_ACCOUNT && (
        <DisplayedAccountLogin
          account={selectedAccount}
          imageSrc={selectedAccount.data?.settings.avatar}
        />
      )}
      {connection ? (
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <div className='flex flex-col gap-7'>
            {!(selectedAccount && selectedAccount !== NEW_ACCOUNT) && (
              <>
                <TextInput
                  {...register('host')}
                  type='text'
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
                  type='text'
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
            <Button ref={submitButtonRef} type='submit' variant='primary'>
              {t('Login.Sign in')}
            </Button>
          </div>
        </form>
      ) : (
        <div>
          <RenderConnectionError
            handleRefreshConnection={handleRefreshConnection}
          />
        </div>
      )}
    </div>
  )
}
