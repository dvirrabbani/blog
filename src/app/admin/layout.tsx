import Link from 'next/link'
import { requireUser } from '@/lib/dal'
import { logout } from '@/lib/actions/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <div className="mb-10 flex items-baseline justify-between border-b border-border pb-4">
        <Link href="/admin" className="font-semibold tracking-tight">
          Admin
        </Link>
        <form action={logout} className="flex items-baseline gap-4 text-sm text-muted">
          <span>{user.email}</span>
          <button type="submit" className="hover:text-foreground">
            Sign out
          </button>
        </form>
      </div>

      {children}
    </div>
  )
}
