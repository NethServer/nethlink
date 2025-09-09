/**
 * JWT utilities for token decoding and validation
 */

export interface JWTPayload {
  username: string
  '2fa'?: boolean
  exp?: number
  iat?: number
  [key: string]: any
}

/**
 * Base64 decode that works in both browser and Node.js
 */
function base64Decode(str: string): string {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    // Browser environment
    return window.atob(str)
  } else {
    // Node.js environment
    return Buffer.from(str, 'base64').toString('utf-8')
  }
}

/**
 * Decode JWT token (client-side only)
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // Split the token into parts
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode the payload (second part)
    const payload = parts[1]
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4)
    
    const decodedPayload = base64Decode(paddedPayload)
    return JSON.parse(decodedPayload) as JWTPayload
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

/**
 * Check if JWT token is expired
 * @param token JWT token string
 * @returns true if expired, false if valid
 */
export function isJWTExpired(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) {
    return true
  }

  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

/**
 * Check if 2FA is required from JWT token
 * @param token JWT token string
 * @returns true if 2FA is required
 */
export function requires2FA(token: string): boolean {
  const payload = decodeJWT(token)
  return payload?.['2fa'] === true
}
