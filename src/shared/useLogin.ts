import { Account, AuthenticationMethod, HostConfig } from "./types"

export const useLogin = () => {

  const parseConfig = (account: Account, config): Account => {
    const voiceHost = account.host.split('.')
    voiceHost.shift()
    voiceHost.join('.')
    let COMPANY_NAME = 'Nethesis'
    let COMPANY_URL = 'https://www.nethesis.it/'
    let SIP_HOST = '127.0.0.1'
    let SIP_PORT = '5060'
    let NUMERIC_TIMEZONE = '+0200'
    let TIMEZONE = 'Europe/Rome'
    let VOICE_ENDPOINT = `voice.${voiceHost}`

    COMPANY_NAME = config.split("COMPANY_NAME: '")[1].split("',")[0].trim() //
    COMPANY_URL = config.split("COMPANY_URL: '")[1].split("',")[0].trim() //
    SIP_HOST = config.split("SIP_HOST: '")[1].split("',")[0].trim() //
    SIP_PORT = config.split("SIP_PORT: '")[1].split("',")[0].trim() //
    NUMERIC_TIMEZONE = config.split("NUMERIC_TIMEZONE: '")[1].split("',")[0].trim() //
    TIMEZONE = config.split(" TIMEZONE: '")[1].split("',")[0].trim() //
    VOICE_ENDPOINT = config.split(" VOICE_ENDPOINT: '")[1].split("',")[0].trim() //

    account.companyName = COMPANY_NAME
    account.companyUrl = COMPANY_URL
    account.sipHost = SIP_HOST
    account.sipPort = SIP_PORT
    account.numeric_timezone = NUMERIC_TIMEZONE
    account.timezone = TIMEZONE
    account.voiceEndpoint = VOICE_ENDPOINT

    return account
  }

  // Read the authentication capabilities; hosts without SSO support have no
  // AUTHENTICATION_METHOD key and default to password.
  const parseHostConfig = (config: string): HostConfig => {
    const read = (key: string) => config.match(new RegExp(`${key}: '([^']*)'`))?.[1] || ''
    const method = read('AUTHENTICATION_METHOD')
    const authenticationMethod: AuthenticationMethod =
      method === 'saml2' || method === 'oidc' ? method : 'password'
    return {
      authenticationMethod,
      ssoLoginUrl: read('SSO_LOGIN_URL'),
      ssoButtonLabel: read('SSO_BUTTON_LABEL'),
      ssoIdpName: read('SSO_IDP_NAME'),
      ssoIdpLogo: read('SSO_IDP_LOGO')
    }
  }

  return {
    parseConfig,
    parseHostConfig
  }
}
