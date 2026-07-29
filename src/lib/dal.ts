import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export type AdminUser = { email: string; name: string }

/**
 * With no database there is no user table, so the single admin account comes from the
 * environment. Both values are required — an account with no password would be an open
 * door, so an incomplete configuration means no admin exists at all.
 */
export function configuredAdmin(): AdminUser | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) return null

  return { email, name: process.env.ADMIN_NAME?.trim() || 'Admin' }
}

/**
 * The cookie carries the email, re-checked against the configured account on every
 * request. Rotating ADMIN_EMAIL therefore invalidates existing sessions.
 */
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const session = await getSession()
  if (!session) return null

  const admin = configuredAdmin()
  if (!admin || admin.email !== session.email) return null

  return admin
})

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}
