import type { NextRequest } from 'next/server'
import { SesameSDK } from '@sesamehr/sdk'
import { getSession } from '@/lib/session'
import { redirectToPath } from '@/lib/request-url'

export async function GET(request: NextRequest) {
  // Parse token from raw query string to preserve '+' characters
  // (URLSearchParams decodes '+' as space per the x-www-form-urlencoded spec)
  const rawParams = new URLSearchParams(request.nextUrl.search.replace(/\+/g, '%2B'))
  const token = rawParams.get('token')
  const sesameRegion = rawParams.get('sesameRegion')

  if (!token || !sesameRegion) {
    return redirectToPath('/login?error=missing_params')
  }

  try {
    const { details } = await SesameSDK.autoLoginWithDetails({
      token,
      region: sesameRegion,
    })

    const session = await getSession()
    session.token = details.token
    session.region = details.region
    session.employeeId = details.employeeId
    session.companyId = details.companyId
    session.employeeName = `${details.profile.firstName} ${details.profile.lastName}`.trim()
    await session.save()

    return redirectToPath('/dashboard')
  } catch {
    return redirectToPath('/login?error=auto_login_failed')
  }
}
