import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/dal'
import { LoginForm } from './login-form'

export const metadata = { title: 'Sign in' }

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/admin')

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Sign in</h1>
      <LoginForm />
    </div>
  )
}
