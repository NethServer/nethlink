import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, SubmitHandler, FieldErrors } from 'react-hook-form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEye as EyeIcon,
  faEyeSlash as EyeSlashIcon,
  faWarning as AlertIcon,
  faCircleNotch,
} from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import { useEffect, useRef, useState } from 'react'
import { Button, TextInput } from '@renderer/components/Nethesis'
import { Account, HostConfig, LoginData, isSsoMethod } from '@shared/types'
import { DisplayedAccountLogin } from './DisplayedAccountLogin'
import { OTPInput, OTPInputRef } from './OTPInput'
import { useLoginPageData, useSharedState } from '@renderer/store'
import { useNethVoiceAPI } from '@shared/useNethVoiceAPI'
import { IPC_EVENTS, NEW_ACCOUNT } from '@shared/constants'
import { Log } from '@shared/utils/logger'
import { getAccountUID } from '@shared/utils/utils'
import { InlineNotification } from '@renderer/components/Nethesis/InlineNotification'
import { requires2FA } from '@shared/utils/jwt'

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
  const [otpCode, setOtpCode] = useState('')
  const [onOTPError, setOnOTPError] = useState(false)
  const [showTwoFactor, setShowTwoFactor] = useLoginPageData('showTwoFactor')
  const [tempAccount, setTempAccount] = useState<Account | undefined>(undefined)
  const [otpDisabled, setOtpDisabled] = useState(false)
  const [loginStep, setLoginStep] = useLoginPageData('loginStep')
  const [hostConfig, setHostConfig] = useLoginPageData('hostConfig')
  const passwordRef = useRef<string>()
  const otpInputRef = useRef() as React.MutableRefObject<OTPInputRef>
  const hostConfigHandlerRef = useRef<(res: { hostConfig?: HostConfig, error?: string }) => void>()
  const ssoResultHandlerRef = useRef<(res: { token?: string, error?: string }) => void>()

  const schema: z.ZodType<LoginData> = z.object({
    host: z
      .string()
      .trim()
      .min(1, `${t('Common.This field is required')}`),
    username: z.string().trim().optional(),
    password: z.string().trim().optional(),
  })

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    setFocus,
    setError: setFieldError,
    formState: { errors },
  } = useForm<LoginData>({
    defaultValues: {},
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    onError(errors, error)
  }, [Object.keys(errors).length, error])

  useEffect(() => {
    window.electron.receive(IPC_EVENTS.SET_HOST_CONFIG, (res) =>
      hostConfigHandlerRef.current?.(res),
    )
    window.electron.receive(IPC_EVENTS.SSO_LOGIN_RESULT, (res) =>
      ssoResultHandlerRef.current?.(res),
    )
  }, [])

  useEffect(() => {
    setIsLoading(false)
    setTempAccount(undefined)
    setOnOTPError(false)
    if (auth?.availableAccounts) {
      if (selectedAccount) {
        if (selectedAccount === NEW_ACCOUNT) {
          setShowTwoFactor(false) // Reset 2FA when switching to new account
          reset()
          setLoginStep('host')
          setHostConfig(undefined)
          focus('host')
        } else {
          setShowTwoFactor(false) // Reset 2FA when switching to existing account
          reset()
          setValue('host', selectedAccount.host)
          setValue('username', selectedAccount.username)
          if (isSsoMethod(selectedAccount.authenticationMethod)) {
            // the SSO entry point is read from the host at every login
            fetchHostConfig(selectedAccount.host)
          } else {
            focus('password')
          }
        }
      } else {
        setShowTwoFactor(false) // Reset 2FA when going back to account list
        setError(undefined)
        setLoginStep('host')
        setHostConfig(undefined)
        focus('host')
      }
    }
  }, [auth, selectedAccount])

  // Handle 2FA reset when back button is pressed from LoginPage
  useEffect(() => {
    if (!showTwoFactor && tempAccount) {
      // Reset 2FA state when going back from OTP verification
      setTempAccount(undefined)
      setOnOTPError(false)
      setIsLoading(false)
      setOtpDisabled(false)
      setOtpCode('')
      setError(undefined)
    }
  }, [showTwoFactor])

  function cleanHost(rawHost: string): string | undefined {
    const hostReg =
      /^(?:(https?:\/\/)?([^:/$]{1,})(?::(\d{1,}))?(?:($|\/(?:[^?#]{0,}))?((?:\?(?:[^#]{1,}))?)?(?:(#(?:.*)?)?|$)))$/g
    return hostReg.exec(rawHost.trim())?.[2]
  }

  // shared login completion: enrich the account with the host configuration,
  // then hand it over to the main process together with the password (empty
  // for SSO accounts)
  function completeLogin(loggedAccount: Account, password: string) {
    window.electron.receive(
      IPC_EVENTS.SET_NETHVOICE_CONFIG,
      (account: Account) => {
        passwordRef.current = password
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
  }

  function fetchHostConfig(host: string) {
    setHostConfig(undefined)
    hostConfigHandlerRef.current = (res) => {
      if (res.hostConfig) {
        setHostConfig(res.hostConfig)
      } else {
        Log.warning('LOGIN unable to read the host configuration', res.error)
        setError(() => new Error(t('Login.Network connection is lost')!))
      }
    }
    window.electron.send(IPC_EVENTS.GET_HOST_CONFIG, host)
  }

  // step 1: read the host authentication capabilities, then show the proper
  // credentials step (username/password or SSO button)
  function handleHostNext(data: LoginData) {
    const host = cleanHost(data.host)
    if (!host) {
      setError(() => new Error(t('Login.Wrong host or username or password')!))
      return
    }
    setIsLoading(true)
    setError(() => undefined)
    hostConfigHandlerRef.current = (res) => {
      setIsLoading(false)
      if (res.hostConfig) {
        setValue('host', host)
        setHostConfig(res.hostConfig)
        setLoginStep('credentials')
        if (res.hostConfig.authenticationMethod === 'password') {
          focus('username')
        }
      } else {
        Log.warning('LOGIN unable to read the host configuration', res.error)
        setError(() => new Error(t('Login.Network connection is lost')!))
      }
    }
    window.electron.send(IPC_EVENTS.GET_HOST_CONFIG, host)
  }

  // Single Sign-On: the main process runs the SSO flow in a dedicated
  // window and returns the minted JWT
  function handleSsoLogin() {
    if (isLoading || !hostConfig?.ssoLoginUrl) return
    const host =
      selectedAccount && selectedAccount !== NEW_ACCOUNT
        ? selectedAccount.host
        : getValues('host')
    setIsLoading(true)
    setError(() => undefined)
    ssoResultHandlerRef.current = async (res) => {
      if (!res.token) {
        setIsLoading(false)
        if (res.error !== 'SSO window closed') {
          Log.warning('LOGIN SSO failed', res.error)
          setError(() => new Error(t('Login.SSO login failed')!))
        }
        return
      }
      try {
        Log.info('LOGIN SSO token received, completing login')
        const loggedAccount = await NethVoiceAPI.Authentication.ssoLogin(
          host,
          res.token,
          hostConfig?.authenticationMethod,
        )
        completeLogin(loggedAccount, '')
        setError(() => undefined)
      } catch (error: any) {
        setIsLoading(false)
        if (error.message === 'User not authorized for NethLink') {
          setError(
            () => new Error(t('Login.User not authorized for NethLink')!),
          )
        } else {
          setError(() => new Error(t('Login.SSO login failed')!))
        }
      }
    }
    window.electron.send(IPC_EVENTS.SSO_LOGIN, {
      host,
      url: hostConfig.ssoLoginUrl,
    })
  }

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
            data.username!,
            data.password!,
          )
          Log.info('LOGIN successfully logged in with credential')

          // Check if 2FA is required
          if (loggedAccount.jwtToken && requires2FA(loggedAccount.jwtToken)) {
            Log.info('LOGIN 2FA required, showing 2FA form')
            setTempAccount(loggedAccount)
            passwordRef.current = data.password
            setShowTwoFactor(true)
            setIsLoading(false)
            return
          }

          // Complete login flow
          completeLogin(loggedAccount, data.password!)

          setFormValues({
            host: '',
            password: '',
            username: '',
          })
          setError(() => undefined)
        } catch (error: any) {
          console.error('LOGIN error during login', error)
          setIsLoading(false)
          if (error.message === 'Wrong username or password') {
            setError(() => new Error(t('Login.Wrong username or password')!))
          } else if (error.message === 'Network connection lost') {
            setError(() => new Error(t('Login.Network connection is lost')!))
          } else if (error.message === 'Unauthorized') {
            setError(
              () => new Error(t('Login.Wrong host or username or password')!),
            )
          } else if (error.message === 'User not authorized for NethLink') {
            Log.info('LOGIN user not authorized for NethLink')
            setError(
              () => new Error(t('Login.User not authorized for NethLink')!),
            )
          } else {
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

  async function handle2FAVerification(e?: React.FormEvent) {
    if (e) {
      e.preventDefault()
    }

    if (!tempAccount) {
      setOnOTPError(true)
      return
    }

    setIsLoading(true)
    setOnOTPError(false)

    try {
      Log.info('LOGIN verifying 2FA code')
      // const { NethVoiceAPI: TempAPI } = useNethVoiceAPI(tempAccount)
      const verifiedAccount = await NethVoiceAPI.Authentication.verify2FA(
        otpCode,
        tempAccount,
      )
      Log.info('LOGIN 2FA verification successful')

      // Complete login flow
      completeLogin(verifiedAccount, passwordRef.current || '')

      setTempAccount(undefined)
      setError(() => undefined)
    } catch (error: any) {
      setIsLoading(false)

      if (error.message === 'OTP invalid') {
        setOnOTPError(true)
        setError(() => new Error(t('Login.2FA.OTP invalid') as string))
      } else if (error.message === 'User not authorized for NethLink') {
        setError(
          () =>
            new Error(t('Login.User not authorized for NethLink') as string),
        )
        setOtpDisabled(true)
      } else {
        console.error('LOGIN error during 2FA verification', error)
        setError(() => new Error(t('Login.Generic error') as string))
      }
    }
  }

  function handleBack2FA() {
    setShowTwoFactor(false)
    setTempAccount(undefined)
    setOnOTPError(false)
    setIsLoading(false)
    setOtpDisabled(false)
    setOtpCode('')
    setError(undefined)
  }

  const onSubmitForm: SubmitHandler<LoginData> = (data) => {
    const isSavedAccount = !!(selectedAccount && selectedAccount !== NEW_ACCOUNT)
    if (!isSavedAccount && loginStep === 'host') {
      handleHostNext(data)
      return
    }
    let valid = true
    if (!isSavedAccount && !data.username?.trim()) {
      setFieldError('username', {
        message: `${t('Common.This field is required')}`,
      })
      valid = false
    }
    if (!data.password?.trim()) {
      setFieldError('password', {
        message: `${t('Common.This field is required')}`,
      })
      valid = false
    }
    if (valid) {
      handleLogin(data)
    }
  }

  function setFormValues(data: LoginData) {
    setValue('host', data.host)
    setValue('username', data.username || '')
    setValue('password', data.password || '')
  }

  const focus = (selector: keyof LoginData) => {
    setTimeout(() => {
      setFocus(selector)
    }, 100)
  }

  const isSavedAccount = !!(selectedAccount && selectedAccount !== NEW_ACCOUNT)
  const authMethod = isSavedAccount
    ? (selectedAccount as Account).authenticationMethod || 'password'
    : hostConfig?.authenticationMethod || 'password'
  const showSsoButton =
    isSsoMethod(authMethod) && (isSavedAccount || loginStep === 'credentials')
  const ssoButtonLabel =
    hostConfig?.ssoButtonLabel || (t('Login.Sign in with SSO') as string)

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
      {showTwoFactor ? (
        <>
          {/* OTP input section */}
          <div>
            <div className='mb-6'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
                {t('Login.2FA.Two-Factor Authentication')}
              </h3>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {t(
                  'Login.2FA.Enter the 6-digit code (OTP code) from your authenticator app. If you cannot access the app, you can use one recovery OTP code.',
                )}
              </p>
            </div>
            {error && (
              <InlineNotification
                type='error'
                title={
                  onOTPError
                    ? t('Login.2FA.OTP verification failed')
                    : t('Login.Login failed')
                }
                className='mt-6'
              >
                {error.message}
              </InlineNotification>
            )}
            <form
              onSubmit={(e) => handle2FAVerification(e)}
              className='space-y-6 mt-6'
            >
              <div className='flex flex-col space-y-2 text-center'>
                <p className='text-sm text-gray-600 dark:text-gray-200 mb-2'>
                  {t('Login.2FA.OTP code')}
                </p>
                <OTPInput
                  ref={otpInputRef}
                  value={otpCode}
                  onChange={setOtpCode}
                  length={6}
                  disabled={isLoading}
                  className='justify-center'
                  error={onOTPError}
                />
              </div>

              <div className='space-y-4'>
                <Button
                  size='large'
                  fullHeight={true}
                  fullWidth={true}
                  variant='primary'
                  type='submit'
                  disabled={isLoading || otpCode.length !== 6 || otpDisabled}
                >
                  <span className='font-medium leading-5 text-sm'>
                    {t('Login.Sign in')}
                  </span>
                  {isLoading && (
                    <FontAwesomeIcon
                      icon={faCircleNotch}
                      className='fa-spin ml-2'
                    />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </>
      ) : (
        <>
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
                {!isSavedAccount && loginStep === 'host' && (
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
                )}
                {!isSavedAccount &&
                  loginStep === 'credentials' &&
                  authMethod === 'password' && (
                    <TextInput
                      {...register('username', {
                        setValueAs: (value) => value?.toLowerCase() || '',
                      })}
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
                  )}
                {authMethod === 'password' &&
                  (isSavedAccount || loginStep === 'credentials') && (
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
                  )}
                {showSsoButton ? (
                  <div className='flex flex-col gap-4'>
                    <Button
                      type='button'
                      variant='primary'
                      disabled={!hostConfig?.ssoLoginUrl}
                      onClick={handleSsoLogin}
                    >
                      {ssoButtonLabel}
                    </Button>
                    {(hostConfig?.ssoIdpName || hostConfig?.ssoIdpLogo) && (
                      <div className='flex items-center justify-center gap-2'>
                        {hostConfig?.ssoIdpLogo && (
                          <img
                            src={hostConfig.ssoIdpLogo}
                            alt=''
                            className='h-5 w-auto'
                          />
                        )}
                        {hostConfig?.ssoIdpName && (
                          <span className='text-sm text-gray-700 dark:text-gray-200'>
                            {hostConfig.ssoIdpName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Button ref={submitButtonRef} type='submit' variant='primary'>
                    {!isSavedAccount && loginStep === 'host'
                      ? t('Login.Continue')
                      : t('Login.Sign in')}
                  </Button>
                )}
              </div>
            </form>
          ) : (
            <div>
              <RenderConnectionError
                handleRefreshConnection={handleRefreshConnection}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
