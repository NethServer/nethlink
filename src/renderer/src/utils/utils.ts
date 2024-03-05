import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MD5 } from 'crypto-js'
import { PropsWithChildren } from 'react'

export const ClassNames = (...args: ClassValue[]) => {
  return twMerge(clsx(...args))
}

export interface ClearProps {
  key: string
  source: Record<string, unknown>
}

const clean = ({ key, source }: ClearProps): object => {
  delete source[key]
  return source
}

export const cleanClassName = (props: PropsWithChildren<object>): object => {
  return clean({
    key: 'className',
    source: props
  })
}

// const [avatarBase64, setAvatarBase64]: any = useState({})
// const getGravatarImageUrl = (email: string) => {
//   const hash = MD5(email.toLowerCase().trim())
//   const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon`

//   return gravatarUrl
// }

// const convertGravatarToBase64 = async () => {
//   const email = textFilter

//   try {
//     const response = await fetch(getGravatarImageUrl(email))
//     const blob = await response.blob()
//     const reader = new FileReader()

//     reader.readAsDataURL(blob)
//     reader.onloadend = () => {
//       const gravatarBase64 = reader.result as string
//       setAvatarBase64({ avatar: gravatarBase64 })
//       setPreviewImage(gravatarBase64)
//     }
//   } catch (error) {
//     console.error('Error', error)
//     setErrorUpload(true)
//   }
// }
