import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { publicUrl } from '@/lib/request-url'

// Where the Cowork backend lives, and the shared secret it expects on the
// server-to-server redeem call. Both are required for the launch flow; leave
// them unset to disable Cowork embedding (the route then fails closed to login).
const COWORK_BACKEND_URL = process.env.COWORK_BACKEND_URL
const LAUNCH_SHARED_SECRET = process.env.LAUNCH_SHARED_SECRET

/** Shape returned by Cowork's `POST /apps/redeem-ticket`. */
interface RedeemResponse {
  token: string
  region: string
  company_id: string
  employee_id: string
  employee_name: string
}

/**
 * Cowork-embedded launch: Cowork mints a single-use `ticket` and loads this app
 * in an iframe at `?ticket=…`. We redeem it server-to-server against Cowork
 * (authenticated with the shared secret), which returns the user's Sesame
 * credentials, and start the session — no login screen inside the iframe.
 *
 * The opaque ticket is the only thing that ever rides the URL; the real Sesame
 * token is exchanged server-side and lands only in the httpOnly session cookie.
 * Redirects use `publicUrl()` so they resolve to the public origin behind a
 * proxy instead of the internal bind address.
 */
export async function GET(request: NextRequest) {
  const failure = NextResponse.redirect(
    publicUrl('/login?error=launch_failed', request),
  )
  failure.headers.set('Referrer-Policy', 'no-referrer')

  const ticket = request.nextUrl.searchParams.get('ticket')
  if (!ticket || !COWORK_BACKEND_URL || !LAUNCH_SHARED_SECRET) {
    return failure
  }

  let credentials: RedeemResponse
  try {
    const res = await fetch(`${COWORK_BACKEND_URL}/apps/redeem-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Launch-Secret': LAUNCH_SHARED_SECRET,
      },
      body: JSON.stringify({ ticket }),
      cache: 'no-store',
    })
    if (!res.ok) return failure
    credentials = (await res.json()) as RedeemResponse
  } catch {
    return failure
  }

  const session = await getSession()
  session.token = credentials.token
  session.region = credentials.region
  session.companyId = credentials.company_id
  session.employeeId = credentials.employee_id
  session.employeeName = credentials.employee_name
  session.embedded = true
  await session.save()

  const response = NextResponse.redirect(publicUrl('/dashboard', request))
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}
