import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const getCurrentUser = cache(async () => {
  const session = await getSession()
  if (!session) return null

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true },
  })
})

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}
