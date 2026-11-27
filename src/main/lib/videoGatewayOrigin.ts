import { session } from 'electron'

// WHEP endpoint of the NethVoice video gateway (MediaMTX)
const VIDEO_GATEWAY_URLS = [
  'https://*/streaming-gw/*',
  'http://*/streaming-gw/*',
]

/**
 * The pages of NethLink are loaded from file://, so their requests carry no
 * Origin header while Chromium marks them as cross-site. The video gateway
 * refuses a cross-site request without a valid origin before checking its
 * token, and the door phone video is never shown. Send the requests to the
 * gateway with the origin of the gateway itself: the access is still granted
 * by the token of the request only.
 */
export function attachVideoGatewayOrigin() {
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: VIDEO_GATEWAY_URLS },
    (details, callback) => {
      const requestHeaders = { ...details.requestHeaders }
      const hasOrigin = Object.keys(requestHeaders).some(
        (name) => name.toLowerCase() === 'origin',
      )
      if (!hasOrigin) {
        requestHeaders['Origin'] = new URL(details.url).origin
      }
      callback({ requestHeaders })
    },
  )
}
