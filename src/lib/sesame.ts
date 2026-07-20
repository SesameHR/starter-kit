import { SesameSDK, SesameApiError } from '@sesamehr/sdk'
import { getSession, isSessionComplete } from './session'
import { redirect, unstable_rethrow } from 'next/navigation'

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
 * Wrap an SDK call. If the token is expired (401/403), hands off to the logout
 * Route Handler, which clears the session and redirects to /login.
 * Use this in Server Components around SDK calls that may fail due to expired tokens.
 *
 * @example
 * const employees = await withAuth(sdk.employees.list({ limit: 20 }))
 */
export async function withAuth<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (error) {
    // Next signals control flow (redirect, notFound, dynamic usage) by throwing.
    // Re-throw those first so the inspection below never swallows them.
    unstable_rethrow(error)

    if (error instanceof SesameApiError && (error.status === 401 || error.status === 403)) {
      // Cookies are readonly while a Server Component renders: destroying the
      // session here would throw ReadonlyRequestCookiesError before the redirect
      // ever ran, and the user would land on the error boundary instead of
      // /login. Redirect to the Route Handler, where cookies are mutable.
      redirect('/api/auth/logout?reason=session_expired')
    }
    throw error
  }
}
