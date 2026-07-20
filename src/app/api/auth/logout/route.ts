import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { publicUrl } from '@/lib/request-url'

/** Reasons a caller may surface on the login screen, as `login.errors.*` keys. */
const ALLOWED_REASONS = new Set(['session_expired'])

/**
 * Clear the session and send the user back to /login.
 *
 * Server Components render with a readonly cookie jar, so they cannot destroy
 * the session themselves — `iron-session`'s `destroy()` writes the cookie
 * synchronously and throws ReadonlyRequestCookiesError. A Route Handler runs in
 * a phase where cookies are mutable, so server-side code that detects an expired
 * token (see `withAuth` in src/lib/sesame.ts) redirects here instead.
 *
 * `?reason=` is forwarded to /login as `?error=` so the login page can explain
 * why the user was signed out; unknown reasons are dropped rather than reflected.
 * Redirects use `publicUrl()` so they resolve to the public origin behind a proxy
 * instead of the internal bind address.
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  session.destroy()

  const reason = request.nextUrl.searchParams.get('reason')
  const target = reason && ALLOWED_REASONS.has(reason) ? `/login?error=${reason}` : '/login'

  const response = NextResponse.redirect(publicUrl(target, request))
  response.headers.set('Cache-Control', 'no-store')
  return response
}
