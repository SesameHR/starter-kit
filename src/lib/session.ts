import { getIronSession, type SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface EmployeeOption {
  id: string
  companyId: string
  companyName: string
  fullName: string
}

export interface SessionData {
  token: string
  region: string
  // Set after employee selection (or auto-set if single employee)
  companyId?: string
  employeeId?: string
  employeeName?: string
  // Available when user has multiple employees/companies
  employees?: EmployeeOption[]
  // True when the session was started by a Cowork launch ticket (embedded in an
  // iframe). Lets the UI hide login/logout chrome that doesn't apply in-frame.
  embedded?: boolean
  // The employee a Cowork launch said may use the back office (/admin). An id,
  // not a flag: a later sign-in as somebody else on this browser inherits nothing.
  backOfficeEmployeeId?: string
}

// When the app runs embedded in a cross-origin iframe (the Cowork Studio
// sandbox), the browser only sends the session cookie back if it is
// `SameSite=None; Secure`. A Lax cookie is dropped on the cross-site redeem
// redirect, so the freshly-authenticated session would appear logged-out inside
// the frame. Gate it on EMBEDDED so a standalone deploy keeps the safer Lax
// default. SameSite=None mandates Secure, so force Secure when embedded too.
// Partitioned (CHIPS) as well: browsers blocking third-party cookies (Safari,
// incognito) only keep an embedded SameSite=None cookie when it is partitioned
// by the top-level site.
const isEmbedded = process.env.EMBEDDED === 'true'

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: process.env.SESSION_COOKIE_NAME || 'sesame-session',
  cookieOptions: {
    httpOnly: true,
    secure: isEmbedded || process.env.NODE_ENV === 'production',
    sameSite: isEmbedded ? ('none' as const) : ('lax' as const),
    partitioned: isEmbedded,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
}

export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

/** Returns true if the session has a fully selected employee. */
export function isSessionComplete(session: SessionData): boolean {
  return !!(session.token && session.employeeId && session.companyId)
}
