'use client'

import { Suspense, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { loginAction, type LoginState } from './actions'

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: 'Authentication failed. Please try again.',
  oauth_not_configured: 'OAuth is not configured on this server.',
  no_employees: 'No employee accounts found for this user.',
  missing_params: 'Invalid callback. Please try again.',
  auto_login_failed: 'Auto-login failed. Please sign in manually.',
}

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
      {errorMessage && <p role="alert">{errorMessage}</p>}

      <form action={action}>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>

        <button type="submit" disabled={pending}>
          {pending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {oauthEnabled && (
        <a href="/api/auth/login">Sign in with Sesame SSO</a>
      )}
    </>
  )
}

export default function LoginPage() {
  return (
    <div>
      <h1>Sign in</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
