import { Account } from '@shared/types'
import classNames from 'classnames'
import { ReactNode, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import spinner from '../assets/loginPageSpinner.svg'
import header from '../assets/loginPageHeader.svg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { TextInput } from '@renderer/components/Nethesis/TextInput'

type LoginData = {
  host: string
  username: string
  password: string
}

const defaultValue = {
  host: 'https://cti.demo-heron.sf.nethserver.net',
  username: 'lorenzo',
  password: 'NethVoice,1234'
}

export function LoginPage() {
  const [displayedAccounts, setDisplayedAccounts] = useState<Account[]>()
  const [selectedAccount, setSelectedAccount] = useState<Account | 'New Account'>()
  const [isNewAccount, setIsNewAccount] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isError, setIsError] = useState<boolean>(false)

  window.api.onLoadAccounts((accounts: Account[]) => setDisplayedAccounts(accounts))

  function resizeThisWindow(w: number, h: number) {
    window.api.resizeLoginWindow(w, h)
  }

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginData>()
  const onSubmit: SubmitHandler<LoginData> = (data) => {
    setIsError(false)
    setIsLoading(true)
    window.api.login(data.host, data.username, data.password).catch(() => {
      setIsLoading(false), setIsError(true)
    })
  }

  function toggleBackArrow(): void {
    throw new Error('Function not implemented.')
  }

  const newAccountForm: ReactNode = (
    <div className="mt-7">
      <p className="text-gray-100 text-xl font-semibold mb-3">Welcome</p>
      <p className="text-gray-100 text-md mb-8">
        Sign in to Nethconnector with your Nethvoice CTI username and password.
      </p>
      <div className="flex flex-col grow gap-7">
        <TextInput
          {...register('host')}
          type="text"
          defaultValue={defaultValue.host}
          label="Nethvoice CTI host"
          error={isError}
        />
        <TextInput
          {...register('username')}
          type="text"
          defaultValue={defaultValue.username}
          label="Username"
          error={isError}
        />
        <TextInput
          {...register('password')}
          type="password"
          defaultValue={defaultValue.password}
          label="Password"
          error={isError}
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
          {displayedAccounts && selectedAccount && (
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="h-6 w-6 text-gray-50"
              onClick={() => toggleBackArrow()}
            />
          )}
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          {displayedAccounts ? (
            <div>
              {selectedAccount ? (
                <div>{selectedAccount === 'New Account' ? newAccountForm : <div></div>}</div>
              ) : (
                <div></div>
              )}
            </div>
          ) : (
            newAccountForm
          )}
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
