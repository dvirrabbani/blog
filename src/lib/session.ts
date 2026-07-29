import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'session'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const secret = process.env.SESSION_SECRET

// Without a secret, tokens would be signed with an empty key and anyone could
// forge a session. Fail at startup in production rather than silently allowing it.
if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error(
    'SESSION_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to the environment.',
  )
}

const encodedKey = new TextEncoder().encode(secret ?? 'insecure-development-only-secret')

export type SessionPayload = { userId: string }

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + MAX_AGE_MS)
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(encodedKey)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, encodedKey, {
      algorithms: ['HS256'],
    })
    return { userId: payload.userId }
  } catch {
    return null
  }
}
