export type Account = {
  username: string
  accessToken?: string
  lastAccess?: string
  host: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
}

export type ConfigFile = {
  lastUser: string | undefined
  accounts: {
    [username: string]: Account
  }
}

export const test = 'asdsa'
