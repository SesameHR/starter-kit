import { SesameSDK, SesameApiError } from '@sesamehr/sdk'
import { getSession, isSessionComplete } from './session'
import { redirect } from 'next/navigation'

/**
 * Get an authenticated SesameSDK instance from the current session.
 * Redirects to /login if no session, or /select-employee if no employee selected.
 */
export async function getSesame(): Promise<SesameSDK> {
  const session = await getSession()

  if (!session.token) {
    redirect('/login')
  }

  if (!isSessionComplete(session)) {
    redirect('/select-employee')
  }

  return new SesameSDK({
    token: session.token,
    region: session.region,
    companyId: session.companyId!,
    employeeId: session.employeeId!,
  })
}

/**
 * Get both the SDK instance and the session data.
 * Useful when you need the employee name for display.
 */
export async function getSesameWithSession() {
  const session = await getSession()

  if (!session.token) {
    redirect('/login')
  }

  if (!isSessionComplete(session)) {
    redirect('/select-employee')
  }

  const sdk = new SesameSDK({
    token: session.token,
    region: session.region,
    companyId: session.companyId!,
    employeeId: session.employeeId!,
  })

  return { sdk, session }
}

/**
 * Wrap an SDK call. If the token is rejected (401), hands off to the logout
 * Route Handler, which clears the session and redirects to /login.
 * Use this in Server Components around SDK calls that may fail due to expired tokens.
 *
 * Never wrap this in a `try/catch` that swallows errors: the hand-off works by
 * throwing NEXT_REDIRECT, so catching it turns the redirect into a silent no-op.
 *
 * @example
 * const employees = await withAuth(sdk.employees.list({ limit: 20 }))
 */
export async function withAuth<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (error) {
    // Only 401 means the token itself was rejected. A 403 is "authenticated but
    // not allowed here" — signing the user out over a permission error would
    // kick them out of the whole app, so let it reach the error boundary.
    if (error instanceof SesameApiError && error.status === 401) {
      // Cookies are readonly while a Server Component renders: destroying the
      // session here would throw ReadonlyRequestCookiesError before the redirect
      // ever ran, and the user would land on the error boundary instead of
      // /login. Redirect to the Route Handler, where cookies are mutable.
      redirect('/api/auth/logout?reason=session_expired')
    }
    throw error
  }
}
