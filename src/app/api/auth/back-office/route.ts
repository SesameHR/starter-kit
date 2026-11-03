import type { NextRequest } from 'next/server'
import { getBackOfficeAccess } from '@/lib/back-office'
import { BACK_OFFICE_MARK_COOKIE, BACK_OFFICE_MARK_MAX_AGE_SECONDS, sealBackOfficeMark } from '@/lib/back-office-mark'
import { redirectToPath } from '@/lib/request-url'
import { sessionOptions } from '@/lib/session'

// Only ever sends the browser back into the back office.
const BACK_OFFICE_PATH = /^\/admin(?:[/?#]|$)/

/**
 * Where the middleware sends a request to /admin with no standing verdict
 * (`@/lib/back-office-mark`): ask Sesame whether the signed-in employee may use
 * the back office, keep the answer in the mark cookie, and go back to `next`.
 * The middleware then lets the page through, or shows /admin/no-access.
 * Without a session, `getBackOfficeAccess()` redirects to /login.
 */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next') ?? ''
  const { session, isAllowed } = await getBackOfficeAccess()

  const response = redirectToPath(BACK_OFFICE_PATH.test(next) ? (next as `/${string}`) : '/admin')
  response.cookies.set(BACK_OFFICE_MARK_COOKIE, await sealBackOfficeMark(session.employeeId ?? '', isAllowed), {
    ...sessionOptions.cookieOptions,
    maxAge: BACK_OFFICE_MARK_MAX_AGE_SECONDS,
  })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
