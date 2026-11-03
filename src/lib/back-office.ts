import { cache } from 'react'
import type { MeProfile } from '@sesamehr/sdk'
import { getSesameWithSession, withAuth } from './sesame'

/**
 * Who may use the back office: the pages under `src/app/admin/`, where the
 * people who run the app manage what its users create.
 *
 * Let in: the company's administrators, as Sesame says at the time of asking,
 * and the employees the deployment names in `ADMIN_EMPLOYEE_IDS` (Cowork
 * Studio names the app's creator). A session Cowork launched carries Cowork's
 * own answer for the same people instead, which spares asking Sesame.
 *
 * The middleware holds every request to /admin to this, through a verdict it
 * keeps for a few minutes (`@/lib/back-office-mark`). Server Actions, which it
 * cannot see, ask here directly: `requireBackOffice()`.
 *
 * Server-only, like `@/lib/sesame`.
 */

// Comma-separated employee ids let in besides the company's administrators.
const allowedEmployeeIds = new Set(
  (process.env.ADMIN_EMPLOYEE_IDS ?? '')
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean),
)

// Sesame's top-level roles that administer a company.
const ADMIN_ROLES = new Set(['owner', 'admin'])

/** Thrown by `requireBackOffice()` when the signed-in employee is not let in. */
export class BackOfficeAccessError extends Error {
  constructor() {
    super('This employee may not use the back office')
    this.name = 'BackOfficeAccessError'
  }
}

/**
 * The signed-in employee, the SDK acting as them, and whether they may use the
 * back office. Redirects to /login (or /select-employee) without a session.
 * Memoised per request, so Sesame is asked once however many callers ask here.
 */
export const getBackOfficeAccess = cache(async () => {
  const { sdk, session } = await getSesameWithSession()
  const employeeId = session.employeeId ?? ''
  const launchedAllowed = !!employeeId && session.backOfficeEmployeeId === employeeId
  if (launchedAllowed || allowedEmployeeIds.has(employeeId.toLowerCase())) {
    return { sdk, session, isAllowed: true }
  }
  const me = await withAuth(sdk.employees.me())
  // `/me` lists one record per company: a role read off another company's
  // record would let its administrator into this one.
  return { sdk, session, isAllowed: me.id === employeeId && isCompanyAdmin(me) }
})

/**
 * Stop here unless the signed-in employee may use the back office.
 *
 * Call it first in EVERY Server Action of the back office, and in any route
 * handler of its outside /admin. A Server Action can be called from any page
 * of the app, so the middleware's hold on /admin does not cover it. Pages
 * under /admin need nothing: the middleware already turned away whoever this
 * would.
 *
 * @example
 * export async function closeRequest(id: string) {
 *   'use server'
 *   await requireBackOffice()
 *   ...
 * }
 */
export async function requireBackOffice() {
  const { sdk, session, isAllowed } = await getBackOfficeAccess()
  if (!isAllowed) {
    throw new BackOfficeAccessError()
  }
  return { sdk, session }
}

function isCompanyAdmin(me: MeProfile): boolean {
  const roles = [me.highestRoleType, me.highestRole].map((role) => String(role ?? '').toLowerCase())
  return (
    roles.some((role) => ADMIN_ROLES.has(role)) ||
    isTrue(me.isSuperAdmin) ||
    isTrue(me.isResellerAdmin) ||
    isTrue(me.isGroupOwner)
  )
}

// Sesame's API is PHP: a flag may arrive as the string "false", which is truthy.
function isTrue(value: unknown): boolean {
  return value === true || value === 1 || value === 'true' || value === '1'
}
