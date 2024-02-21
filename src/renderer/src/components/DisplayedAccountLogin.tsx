import { Account } from '@shared/types'
import placeholder from '../assets/AvatarPlaceholderLoginPage.svg'

type DisplayedAccountLoginProps = {
  account?: Account
  imageSrc?: string
  onClick: () => void
}

export function DisplayedAccountLogin({ account, imageSrc, onClick }: DisplayedAccountLoginProps) {
  return (
    <div
      onClick={() => onClick()}
      className="w-full flex flex-row gap-7 items-center justify-start bg-gray-800 hover:bg-gray-700 h-20 rounded-lg text-gray-50"
    >
      <div className="ml-5 w-12 h-12 rounded-full overflow-hidden">
        <img src={imageSrc ?? placeholder}></img>
      </div>
      <p>Ciao</p>
    </div>
  )
}
