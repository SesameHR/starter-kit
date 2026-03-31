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
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: process.env.SESSION_COOKIE_NAME || 'sesame-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
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
