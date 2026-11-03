import { sealData, unsealData } from 'iron-session'
import type { NextRequest } from 'next/server'

/**
 * The back office's verdict for the signed-in employee, kept for a few minutes
 * in a sealed cookie of its own, so the middleware can hold every request to
 * /admin to it without asking Sesame each time.
 *
 * Issued only by /api/auth/back-office, after `@/lib/back-office` asked Sesame.
 * Bound to the employee it was issued for: signing in as someone else makes it
 * worthless. Edge-safe: the middleware imports it.
 */

const password = process.env.SESSION_SECRET ?? ''
const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'sesame-session'

export const BACK_OFFICE_MARK_COOKIE = `${sessionCookieName}-back-office`
// How long a verdict stands: a revoked administrator keeps seeing back-office
// pages for at most this long. Server Actions ask Sesame again every time.
export const BACK_OFFICE_MARK_MAX_AGE_SECONDS = 10 * 60

export type BackOfficeVerdict = 'allowed' | 'refused'

interface BackOfficeMark {
  employeeId: string
  isAllowed: boolean
  checkedAt: number
}

/** Seal a fresh verdict for `employeeId`, as the mark cookie's value. */
export function sealBackOfficeMark(employeeId: string, isAllowed: boolean): Promise<string> {
  const mark: BackOfficeMark = { employeeId, isAllowed, checkedAt: Date.now() }
  return sealData(mark, { password, ttl: BACK_OFFICE_MARK_MAX_AGE_SECONDS })
}

/**
 * The standing verdict for whoever is signed in on this request, or `undefined`
 * when there is none to trust: no mark, an expired one, or one issued for
 * another employee than the session's.
 */
export async function readBackOfficeVerdict(request: NextRequest): Promise<BackOfficeVerdict | undefined> {
  const sealedMark = request.cookies.get(BACK_OFFICE_MARK_COOKIE)?.value
  const sealedSession = request.cookies.get(sessionCookieName)?.value
  if (!sealedMark || !sealedSession) return undefined
  try {
    const mark = await unsealData<Partial<BackOfficeMark>>(sealedMark, { password })
    const session = await unsealData<{ employeeId?: string }>(sealedSession, { password })
    const isCurrent =
      typeof mark.checkedAt === 'number' && Date.now() - mark.checkedAt < BACK_OFFICE_MARK_MAX_AGE_SECONDS * 1000
    if (!isCurrent || !mark.employeeId || mark.employeeId !== session.employeeId) return undefined
    return mark.isAllowed === true ? 'allowed' : 'refused'
  } catch {
    // Sealed with another secret, or not a seal at all.
    return undefined
  }
}
