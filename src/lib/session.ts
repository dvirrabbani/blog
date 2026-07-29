import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'session'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Read at call time, not module scope. SESSION_SECRET is runtime configuration, and
 * reading it while modules evaluate makes the *build* fail when it is absent — which
 * blocks deploying the public blog over a variable only the admin routes need.
 *
 * Without a secret, tokens would be signed with an empty key and anyone could forge a
 * session, so production still refuses — just at the point of use rather than at import.
 */
function signingKey() {
  const secret = process.env.SESSION_SECRET

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SESSION_SECRET is not set.\n' +
          'Generate one:  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"\n' +
          "Then add it in your host's environment variable settings — not in a .env file,\n" +
          'which is gitignored and never uploaded. On Vercel, tick every environment it\n' +
          'should apply to; a variable scoped to Production only is absent from Previews.',
      )
    }
    return new TextEncoder().encode('insecure-development-only-secret')
  }

  return new TextEncoder().encode(secret)
}

export type SessionPayload = { userId: string }

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + MAX_AGE_MS)
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(signingKey())

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
    const { payload } = await jwtVerify<SessionPayload>(token, signingKey(), {
      algorithms: ['HS256'],
    })
    return { userId: payload.userId }
  } catch {
    return null
  }
}
