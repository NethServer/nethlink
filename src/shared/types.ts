import { MENU_ELEMENT, NEW_ACCOUNT } from "./constants"

export type AvailableThemes = 'system' | 'light' | 'dark'

export enum PAGES {
  SPLASHSCREEN = "splashscreenpage",
  LOGIN = "NethLink-Login",
  PHONEISLAND = "phoneislandpage",
  NETHLINK = "NethLink",
  DEVTOOLS = "devtoolspage"

}

export type StateType<T> = [(T | undefined), (value: T | undefined) => void]
export type UseStoreStateType = <T>(selector: keyof LocalStorageData) => [T | undefined, (arg0: T | ((ex: T) => T | undefined) | undefined) => void]

export type Account = {
  username: string
  accessToken?: string
  lastAccess?: string
  host: string
  theme: AvailableThemes
  phoneIslandPosition?: { x: number; y: number }
  nethlinkBounds?: Electron.Rectangle
  sipPort?: string
  sipHost?: string
  voiceEndpoint?: string
  numeric_timezone?: string
  timezone?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: AccountData,
}


export type LoginData = {
  host: string
  username: string
  password: string
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

export type BaseAccountData = {
  name: string
  username: string
  mainPresence: StatusTypes
  presence: StatusTypes
  presenceOnBusy: StatusTypes
  presenceOnUnavailable: StatusTypes
  recallOnBusy: string
  endpoints: {
    email: BaseEndpoint[]
    jabber: Jabber[]
    extension: Extension[]
    cellphone: BaseEndpoint[]
    voicemail: BaseEndpoint[]
    mainextension: BaseEndpoint[]
  }
}
export type AccountData = BaseAccountData & {
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
  settings: UserSettings,
  mainextension?: string
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
  avatar?: string
}

export type MultipleResponse<T> = {
  count: number
  rows: T[]
}
export type HistorySpeedDialType = MultipleResponse<ContactType>
export type HistoryCallData = MultipleResponse<CallData>
export type SearchCallData = MultipleResponse<SearchData>

export type SearchData = {
  isOperator: boolean
  kind: 'person' | 'company',
  contacts?: any
  displayName: string
  cellphone: string
  company: string
  extension: string
  fax: string
  homecity: string
  homecountry: string
  homeemail: string
  homephone: string
  homepob: string
  homepostalcode: string
  homeprovince: string
  homestreet: string
  id: number
  name: string
  notes: string
  owner_id: string
  source: string
  speeddial_num: string
  title: string
  type: string
  url: string
  workcity: string
  workcountry: string
  workemail: string
  workphone: string
  workpob: string
  workpostalcode: string
  workprovince: string
  workstreet: string
}
export type CallData = {
  time?: number
  channel?: string
  dstchannel?: string
  uniqueid?: string
  linkedid?: string
  userfield?: string
  duration?: number
  billsec?: number
  disposition?: string
  dcontext?: string
  lastapp?: string
  recordingfile?: string
  cnum?: string
  cnam?: string
  ccompany?: string
  src?: string
  dst?: string
  dst_cnam?: string
  dst_ccompany?: string
  clid?: string
  direction?: string
  queue?: string
}

export type LastCallData = CallData & { username: string, hasNotification: boolean }

export type StatusTypes =
  | 'available'
  | 'online'
  | 'dnd'
  | 'voicemail'
  | 'cellphone'
  | 'callforward'
  | 'busy'
  | 'incoming'
  | 'ringing'
  | 'offline'

export type ContactType = {
  id?: string | number
  owner_id?: string
  type?: string
  homeemail?: string
  workemail?: string
  homephone?: string
  workphone?: string
  cellphone?: string
  fax?: string
  title?: string
  company?: string
  notes?: string
  name?: string
  homestreet?: string
  homepob?: string
  homecity?: string
  homeprovince?: string
  homepostalcode?: string
  homecountry?: string
  workstreet?: string
  workpob?: string
  workcity?: string
  workprovince?: string
  workpostalcode?: string
  workcountry?: string
  url?: string
  extension?: string
  speeddial_num?: string
  source?: string
  privacy?: string
  favorite?: boolean
  selectedPrefNum?: string
}

export type NewContactType = {
  name: string
  privacy?: string
  favorite?: boolean
  selectedPrefNum?: string
  setInput?: string
  type?: string
  speeddial_num?: string
  company?: string
  note?: string
}

export type NewSpeedDialType = {
  name: string
  privacy?: string
  favorite?: boolean
  selectedPrefNum?: string
  setInput?: string
  type?: string
  speeddial_num?: string
  note?: string
}

export type OperatorData = {
  userEndpoints: UserEndpointsType
  extensions: ExtensionsType
  operators: OperatorsType
  groups: GroupsType
  avatars: AvatarType
}

export type UserEndpointsType = {
  [username: string]: BaseAccountData & {
    avatarBase64?: string
  }
}

export type OperatorsType = {
  [username: string]: BaseAccountData
}

export type GroupsType = {
  [groupName: string]: {
    users: string[] // contains the usernames
  }
}

export type ExtensionsType = {
  [phoneNumber: string]: {
    cf: string
    cfVm: string
    cfb: string
    cfbVm: string
    cfu: string
    cfuVm: string
    chanType: string
    codecs: string[]
    context: string
    conversations: {}
    dnd: false
    exten: string
    ip: string
    mac: string
    name: string
    port: string
    sipuseragent: string
    status: string
    username: string
  }
}

export type AvatarType = {
  [username: string]: string //if present there is base64
}

export type QueuesType = {
  [username: string]: {
    name: string
    queue: string
    members: {
      [user: string]: {
        callsTakenCount: number
        lastCallTimestamp: number
        lastPausedInReason: string
        lastPausedInTimestamp: number
        lastPausedOutTimestamp: number
        loggedIn: boolean
        member: string
        name: string
        paused: boolean
        queue: string
        type: string
      }
    }
    avgHoldTime: string
    avgTalkTime: string
    serviceLevelPercentage: string
    serviceLevelTimePeriod: string
    waitingCallers: object
  }
}

export type PageType = {
  query: string
  page: keyof typeof PAGES | 'main'
  props: {
    appVersion?: string,
    page: keyof typeof PAGES | 'main'
  }
}


export type Size = { w: number; h: number }

export type LocalStorageData = {
  account?: Account,
  auth?: AuthAppData,
  page?: PageType,
  operators?: OperatorData,
  queues?: QueuesType,
  lastCalls?: CallData[],
  speeddials?: ContactType[],
  theme?: AvailableThemes,
  loginPageData?: LoginPageData,
  nethLinkPageData?: NethLinkPageData,
  phoneIslandPageData?: PhoneIslandPageData,
  missedCalls?: CallData[],
  notifications?: NotificationData,
  lostCallNotifications?: CallData[],
  connection?: boolean,
}

export type OnDraggingWindow = {
  [key: string]: DraggingWindow
}

export type DraggingWindow = {
  interval: number,
  startMousePosition: { x: number, y: number },
  startWindowPosition: { x: number, y: number }
}

export type PhoneIslandPageData = {
  isExpanded: boolean,
  isMinimized: boolean,
  isDisconnected: boolean
}

export type LoginPageData = {
  selectedAccount?: Account | typeof NEW_ACCOUNT
  isLoading: boolean
  windowHeight?: number
}

export type AuthAppData = {
  lastUser: string | undefined,
  lastUserCryptPsw?: Buffer
  isFirstStart: boolean,
  availableAccounts: {
    [accountUID: string]: Account
  }
}
export type NethLinkPageData = {
  selectedSidebarMenu: MENU_ELEMENT,
  showPhonebookSearchModule?: boolean,
  showAddContactModule?: boolean,
  speeddialsModule?: SpeedDialModuleData
  phonebookSearchModule?: PhonebookSearchModuleData
  phonebookModule?: PhonebookModuleData,
}

export type SpeedDialModuleData = {
  selectedSpeedDial?: ContactType
  selectedFavourite?: ContactType
}

export type PhonebookSearchModuleData = {
  searchText?: string | null,
}

export type PhonebookModuleData = {
  selectedContact?: SelectedContact
}

export type SelectedContact = {
  number?: string
  company?: string
}


export type NotificationData = {
  system: {
    update: NotificationItem
  }
}

export type NotificationItem = {
  message: string,
}
