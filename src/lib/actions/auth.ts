'use server'

import { createHash, timingSafeEqual } from 'node:crypto'
import { redirect } from 'next/navigation'
import { createSession, deleteSession } from '@/lib/session'
import { configuredAdmin } from '@/lib/dal'

export type LoginState = { error?: string } | undefined

/**
 * Hashing both sides first gives two equal-length buffers, so timingSafeEqual can be
 * used without leaking the expected password's length through the comparison.
 */
function matches(candidate: string, expected: string) {
  const a = createHash('sha256').update(candidate).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const admin = configuredAdmin()

  if (!admin) {
    return {
      error:
        'No admin account is configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment.',
    }
  }

  // Compare the password even when the email is wrong, so a wrong address does not
  // return measurably faster than a wrong password.
  const passwordOk = matches(password, process.env.ADMIN_PASSWORD ?? '')

  if (email !== admin.email || !passwordOk) {
    return { error: 'Invalid email or password.' }
  }

  await createSession(admin.email)
  redirect('/admin')
}

export async function logout() {
  await deleteSession()
  redirect('/')
}
