'use client'

import { Suspense, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SesameMark } from '@/components/SesameLogo'
import { loginAction, type LoginState } from './actions'

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: 'Authentication failed. Please try again.',
  oauth_not_configured: 'OAuth is not configured on this server.',
  no_employees: 'No employee accounts found for this user.',
  missing_params: 'Invalid callback. Please try again.',
  auto_login_failed: 'Auto-login failed. Please sign in manually.',
}

const inputClass =
  'w-full rounded-2xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'

function LoginForm() {
  const [state, action, pending] = useActionState<LoginState | null, FormData>(
    loginAction,
    null,
  )
  const searchParams = useSearchParams()
  const oauthError = searchParams.get('error')
  const oauthEnabled = searchParams.get('oauth') !== '0'

  const errorMessage =
    state?.error || (oauthError ? ERROR_MESSAGES[oauthError] || oauthError : null)

  return (
    <>
      {errorMessage && (
        <div role="alert" className="mb-4 rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[13px] font-medium text-foreground">
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-[13px] font-medium text-foreground">
            Password
          </label>
          <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" className={inputClass} />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {oauthEnabled && (
        <>
          <div className="my-5 flex items-center gap-3 text-[12px] text-muted-foreground">
            <span className="h-px flex-1 bg-divider" />
            or
            <span className="h-px flex-1 bg-divider" />
          </div>
          <a
            href="/api/auth/login"
            className="flex w-full items-center justify-center rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Sign in with Sesame SSO
          </a>
        </>
      )}
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2.5">
          <SesameMark size={40} />
          <span className="font-sans text-xl font-bold lowercase leading-none tracking-tight text-foreground">sesame</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use your Sesame HR credentials</p>
          <div className="mt-6">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        <p className="mt-6 text-center text-[11.5px] text-muted-foreground">Built with @sesamehr/sdk</p>
      </div>
    </div>
  )
}
