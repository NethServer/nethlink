export type Account = {
  username: string
  accessToken?: string
  lastAccess?: string
  host: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: AccountData
}

export type ConfigFile = {
  lastUser: string | undefined
  accounts: {
    [username: string]: Account
  }
}

export type PhoneIslandConfig = {
  hostname: string
  username: string
  authToken: string
  sipExten: string
  sipSecret: string
  sipHost: string
  sipPort: string
}

export type AccountData = {
  name: string
  username: string
  mainPresece: string
  presence: string
  presenceOnBusy: string
  presenceOnUnavailable: string
  recallOnBusy: string
  endpoints: {
    email: BaseEndpoint[]
    jabber: Jabber[]
    extension: Extension[]
    cellphone: BaseEndpoint[]
    voicemail: BaseEndpoint[]
    mainextension: BaseEndpoint[]
  }
  profile: {
    id: string
    name: string
    macro_permissions: {
      [macro_permission_name: string]: {
        value: boolean
        permissions: {
          [permission_name: string]: { id: string; name: string; value: boolean }
        }
      }
    }
    outbound_routes_permissions: OutboundRoutePermission[]
  }
  default_device: Extension
  settings: UserSettings
}

export type BaseEndpoint = {
  id: string
  description?: string
}

export type Jabber = {
  server: string
} & BaseEndpoint

export type Extension = {
  type: string
  secret: string
  username: string
  actions: object
  proxy_port: string | null
} & BaseEndpoint

export type OutboundRoutePermission = {
  route_id: string
  name: string
  permission: boolean
}
export type UserSettings = {
  desktop_notifications: true
  open_ccard: 'enabled' | 'disabled'
  chat_notifications: true
}
