import type { NextRequest, NextResponse } from 'next/server'
import { getSSOClient } from '@/lib/oauth'
import { getSession, type EmployeeOption } from '@/lib/session'
import { redirectToPath } from '@/lib/request-url'
import { configFromCredentials, type SesameCredentials } from '@sesamehr/sdk'

/** Redirect and clear the OAuth state cookie in every exit path. */
function redirectClean(path: `/${string}`): NextResponse {
  const response = redirectToPath(path)
  response.cookies.delete('oauth-state')
  return response
}

export async function GET(request: NextRequest) {
  const sso = getSSOClient()
  if (!sso) {
    return redirectClean('/login?error=oauth_not_configured')
  }

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const storedState = request.cookies.get('oauth-state')?.value

  if (!code || !state) {
    return redirectClean('/login?error=missing_params')
  }

  if (!storedState || storedState !== state) {
    return redirectClean('/login?error=auth_failed')
  }

  try {
    const result = await sso.exchangeCodeForToken(code, state, {
      includeUserInfo: false,
      includeSesameCredentials: true,
    })

    const credentials = result.sesameCredentials as unknown as SesameCredentials
    if (!credentials?.employees?.length) {
      return redirectClean('/login?error=no_employees')
    }

    const session = await getSession()
    session.token = credentials.sesame_private_token
    session.region = credentials.region

    if (credentials.employees.length === 1) {
      // Single employee — go straight to dashboard
      const config = configFromCredentials(credentials)
      const emp = credentials.employees[0]
      session.employeeId = config.employeeId
      session.companyId = config.companyId
      session.employeeName = emp.full_name
      await session.save()
      return redirectClean('/dashboard')
    }

    // Multiple employees — let user choose
    session.employees = credentials.employees.map(
      (emp): EmployeeOption => ({
        id: emp.sesame_employee_id,
        companyId: emp.company_id,
        companyName: emp.company_name,
        fullName: emp.full_name,
      }),
    )
    await session.save()
    return redirectClean('/select-employee')
  } catch {
    return redirectClean('/login?error=auth_failed')
  }
}
