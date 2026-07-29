'use client'

import { useActionState } from 'react'
import { login } from '@/lib/actions/auth'

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm text-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="w-full rounded border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm text-muted">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
