export enum IPC_EVENTS {
  LOAD_ACCOUNTS = 'LOAD_ACCOUNTS',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCOUNT_CHANGE = 'ACCOUNT_CHANGE',
  GET_ACCOUNT = 'GET_ACCOUNT',
  GET_SPEED_DIALS = 'GET_SPEED_DIALS',
  OPEN_SPEEDDIALS_PAGE = 'OPEN_SPEEDDIALS_PAGE',
  GET_LAST_CALLS = 'GET_LAST_CALLS',
  OPEN_ALL_CALLS_PAGE = 'OPEN_ALL_CALLS_PAGE',
  OPEN_ADD_TO_PHONEBOOK_PAGE = 'OPEN_ADD_TO_PHONEBOOK_PAGE',
  CREATE_NEW_ACCOUNT = 'CREATE_NEW_ACCOUNT',
  START_CALL = 'START_CALL',
  EMIT_START_CALL = 'EMIT_START_CALL',
  ON_DATA_CONFIG_CHANGE = 'ON_DATA_CONFIG_CHANGE',
  INITIALIZATION_COMPELTED = 'INITIALIZATION_COMPELTED',
  RECEIVE_SPEEDDIALS = 'RECEIVE_SPEEDDIALS',
  RECEIVE_HISTORY_CALLS = 'RECEIVE_HISTORY_CALLS',
  UPDATE_MAIN_PRESENCE = 'UPDATE_MAIN_PRESENCE',
  UPDATE_CONVERSATIONS = 'UPDATE_CONVERSATIONS',
  QUEUE_MEMBER_UPDATE = 'QUEUE_MEMBER_UPDATE'
}

export enum PHONE_ISLAND_EVENTS {
  //PHONE ISLAND EVENTS
  'phone-island-main-presence' = 'phone-island-main-presence',
  'phone-island-conversations' = 'phone-island-conversations',
  'phone-island-queue-update' = 'phone-island-queue-update',
  'phone-island-queue-member-update' = 'phone-island-queue-member-update',
  'phone-island-user-already-login' = 'phone-island-user-already-login',
  'phone-island-server-reloaded' = 'phone-island-server-reloaded',
  'phone-island-server-disconnected' = 'phone-island-server-disconnected',
  'phone-island-socket-disconnected' = 'phone-island-socket-disconnected',
  'phone-island-parking-update' = 'phone-island-parking-update'
}
