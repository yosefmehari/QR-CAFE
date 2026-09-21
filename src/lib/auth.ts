import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export type UserRole = 'ADMIN' | 'KITCHEN' | 'JUICE_MAKER' | 'WAITER' | 'DELIVERY'

export { isOwner, OWNER_EMAIL } from './owner'

export interface SessionPayload {
  userId: string
  email: string
  name: string
  role: UserRole
  exp?: number
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'qr-cafe-super-secret-jwt-key-for-development-only-replace-in-production'
)

export const SESSION_COOKIE_NAME = 'qr_cafe_session'

/**
 * Creates a signed JWT session token valid for 7 days
 */
export async function createSessionToken(payload: Omit<SessionPayload, 'exp'>): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

/**
 * Verifies and decodes a signed JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/**
 * Retrieves the current user session from HTTP cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) return null
  return await verifySessionToken(token)
}

/**
 * Sets the secure session cookie on the response
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

/**
 * Clears the session cookie (logout)
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
