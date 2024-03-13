import { Account } from '@shared/types'
import classNames from 'classnames'
import { ReactNode, useEffect, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import spinner from '../assets/loginPageSpinner.svg'
import header from '../assets/loginPageHeader.svg'
import avatar from '../assets/AvatarProvaLoginPage.jpeg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faX } from '@fortawesome/free-solid-svg-icons'
import { TextInput } from '@renderer/components/Nethesis/TextInput'
import { DisplayedAccountLogin } from '@renderer/components/DisplayedAccountLogin'
import { useInitialize } from '@renderer/hooks/useInitialize'
import { log } from '@shared/utils/logger'

type LoginData = {
  host: string
  username: string
  password: string
}

export function LoginPage() {
  const [displayedAccounts, setDisplayedAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | 'New Account'>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isError, setIsError] = useState<boolean>(false)

  useInitialize(() => {
    window.api.onLoadAccounts((accounts: Account[]) => {
      setDisplayedAccounts(accounts)
    })
  }, true)

  function resizeThisWindow(h: number) {
    window.api.resizeLoginWindow(h)
  }

  function hideLoginWindow() {
    window.api.hideLoginWindow()
  }

  async function handleLogin(data: LoginData) {
    if (data.host.slice(-1) === '/') data.host = data.host.slice(0, data.host.length - 2)
    const [returnValue, err] = await window.api.login(data.host, data.username, data.password)
    log(data, returnValue, err)
    setIsError(!!err)
    !err && setSelectedAccount(undefined)
    setIsLoading(false)
  }

  const {
    register,
    handleSubmit,
    setValue,
    reset,
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

  useEffect(() => {
    if (selectedAccount) {
      if (selectedAccount === 'New Account') {
        resizeThisWindow(570)
        reset()
      } else {
        resizeThisWindow(445)
        reset()
        setValue('host', selectedAccount.host)
        setValue('username', selectedAccount.username)
      }
    } else {
      setIsError(false)
      if (displayedAccounts.length === 1) {
        resizeThisWindow(375)
      } else if (displayedAccounts.length === 2) {
        resizeThisWindow(455)
      } else if (displayedAccounts.length >= 3) {
        resizeThisWindow(535)
      }
    }
  }, [displayedAccounts, selectedAccount])

  const newAccountForm: ReactNode = (
    <div className="dark mt-7">
      <p className="text-gray-100 text-xl font-semibold mb-3">Welcome</p>
      <p className="text-gray-100 text-md mb-8">
        Sign in to Nethconnector with your Nethvoice CTI username and password.
      </p>
      <div className="flex flex-col grow gap-7">
        <TextInput
          {...register('host')}
          type="text"
          label="Nethvoice CTI host"
          error={isError || Boolean(errors.host)}
        />
        <TextInput
          {...register('username')}
          type="text"
          label="Username"
          error={isError || Boolean(errors.username)}
        />
        <TextInput
          {...register('password')}
          type="password"
          label="Password"
          error={isError || Boolean(errors.password)}
        />
        <input
          type="submit"
          className="w-full bg-blue-500 rounded h-9 font-semibold mt-2 cursor-pointer"
          value="Sign in"
        />
      </div>
    </div>
  )

  return (
    <div className="h-[100vh] w-[100vw] bg-gray-900 relative p-8 rounded-[10px]">
      <div className={classNames('h-full w-full', isLoading ? 'brightness-50' : '')}>
        <div className="flex flex-row justify-between items-end">
          <img src={header}></img>
          {displayedAccounts.length > 0 && selectedAccount && (
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="h-5 w-5 text-gray-50 ml-12 cursor-pointer"
              onClick={() => setSelectedAccount(undefined)}
            />
          )}
          <FontAwesomeIcon
            icon={faX}
            className="h-5 w-5 text-gray-50 cursor-pointer"
            onClick={() => hideLoginWindow()}
          />
        </div>
        <form
          onSubmit={async (e) => {
            setIsError(false)
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
                      <div className="dark w-full mt-7">
                        <p className="text-gray-100 text-xl font-semibold mb-3">Account list</p>
                        <p className="text-gray-100 text-md mb-5">
                          Choose an account to continue to Nethconnector.
                        </p>
                        <DisplayedAccountLogin account={selectedAccount} imageSrc={avatar} />
                        <TextInput
                          {...register('password')}
                          type="password"
                          label="Password"
                          error={isError || Boolean(errors.password)}
                          className="mt-5"
                        />
                        <input
                          type="submit"
                          className="w-full bg-blue-500 rounded h-9 font-semibold mt-7 cursor-pointer"
                          value="Sign in"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  //altrimenti mostro la finestra per la creazione del primo account
                  <div className="w-full mt-7">
                    <p className="text-gray-100 text-xl font-semibold mb-3">Account list</p>
                    <p className="text-gray-100 text-md mb-8">
                      Choose an account to continue to Nethconnector.
                    </p>
                    <div className="max-h-60 overflow-y-auto">
                      {displayedAccounts.map((account, idx) => {
                        return (
                          <DisplayedAccountLogin
                            key={idx}
                            account={account}
                            imageSrc={avatar}
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
