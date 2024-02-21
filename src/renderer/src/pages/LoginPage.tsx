import { Account } from '@shared/types'
import classNames from 'classnames'
import { ReactNode, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import spinner from '../assets/loginPageSpinner.svg'
import header from '../assets/loginPageHeader.svg'
import avatar from '../assets/AvatarProvaLoginPage.jpeg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { TextInput } from '@renderer/components/Nethesis/TextInput'
import { DisplayedAccountLogin } from '@renderer/components/DisplayedAccountLogin'

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

  const newAccountForm: ReactNode = (
    <div className="mt-7">
      <p className="text-gray-100 text-xl font-semibold mb-3">Welcome</p>
      <p className="text-gray-100 text-md mb-8">
        Sign in to Nethconnector with your Nethvoice CTI username and password.
      </p>
      <div className="flex flex-col grow gap-7">
        <TextInput
          {...register('host', { required: true })}
          type="text"
          defaultValue={defaultValue.host}
          label="Nethvoice CTI host"
          error={isError || Boolean(errors.host)}
        />
        <TextInput
          {...register('username', { required: true })}
          type="text"
          defaultValue={defaultValue.username}
          label="Username"
          error={isError || Boolean(errors.username)}
        />
        <TextInput
          {...register('password', { required: true })}
          type="password"
          defaultValue={defaultValue.password}
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
          {displayedAccounts && selectedAccount && (
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="h-6 w-6 text-gray-50"
              onClick={() => setSelectedAccount(undefined)}
            />
          )}
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          {true ? (
            <div>
              {selectedAccount ? (
                <div>{selectedAccount === 'New Account' ? newAccountForm : <div></div>}</div>
              ) : (
                <div>
                  <DisplayedAccountLogin
                    account={{
                      username: '',
                      accessToken: undefined,
                      lastAccess: undefined,
                      host: '',
                      data: undefined
                    }}
                    imageSrc={avatar}
                  />
                </div>
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
