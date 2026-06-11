/**
 * Sesame two-factor (TOTP) login.
 *
 * When an account has Sesame's double-factor authentication enabled, the
 * credentials login returns HTTP 422 with the status message
 * `double_factor_authentication_active_and_configured`. The login must then be
 * completed against `/private/core/v3/double-factor-authentication/login`,
 * sending the credentials again plus the 6-digit code as `temporalKey`.
 *
 * The SDK (`@sesamehr/sdk`) doesn't cover this endpoint yet, so this module
 * mirrors its `directLogin()` flow: pre-login (region) → 2FA login (token) →
 * me-oauth (employees).
 */

const LOGIN_FINDER_URL = 'https://login.sesametime.com'
const PRE_LOGIN_ENDPOINT = '/private/login-finder/v1/pre-login'
const TWO_FACTOR_LOGIN_ENDPOINT = '/private/core/v3/double-factor-authentication/login'
const ME_ENDPOINT = '/api/v3/security/me-oauth'

export const TWO_FACTOR_CODE_LENGTH = 6

export interface TwoFactorEmployee {
  id: string
  companyId: string
  companyName: string
  firstName: string
  lastName: string
}

export interface TwoFactorLoginResult {
  token: string
  region: string
  employees: TwoFactorEmployee[]
}

/** The supplied TOTP code was rejected by Sesame (wrong or expired). */
export class InvalidTwoFactorCodeError extends Error {
  constructor() {
    super('Invalid two-factor code')
    this.name = 'InvalidTwoFactorCodeError'
  }
}

/**
 * Inspect a failed `SesameSDK.loginWithDetails()` error for Sesame's
 * double-factor status.
 *
 * Returns `'configured'` when the user must now provide their authenticator
 * code, `'not_configured'` when 2FA is enforced for the account but the user
 * hasn't set up an authenticator app yet, and `null` for unrelated errors.
 */
export function twoFactorStatus(err: unknown): 'configured' | 'not_configured' | null {
  if (!(err instanceof Error) || !err.message.includes('double_factor')) {
    return null
  }

  return err.message === 'double_factor_authentication_active_and_configured'
    ? 'configured'
    : 'not_configured'
}

/**
 * Complete a Sesame login that requires a two-factor code.
 *
 * @throws InvalidTwoFactorCodeError when Sesame rejects the code (401/422)
 * @throws Error for any other API failure
 */
export async function loginWithTwoFactor(params: {
  email: string
  password: string
  code: string
}): Promise<TwoFactorLoginResult> {
  const region = await findRegion(params.email)
  const baseUrl = `https://back-${region.toLowerCase()}.sesametime.com`

  const response = await fetch(`${baseUrl}${TWO_FACTOR_LOGIN_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      temporalKey: params.code,
    }),
  })

  // 401/422 here means the code was wrong or expired
  if (response.status === 401 || response.status === 422) {
    throw new InvalidTwoFactorCodeError()
  }
  if (!response.ok) {
    throw new Error(`Sesame two-factor login failed: HTTP ${response.status}`)
  }

  const json = (await response.json()) as { data?: string }
  const token = json.data
  if (!token) {
    throw new InvalidTwoFactorCodeError()
  }

  const employees = await getEmployees(baseUrl, token)

  return { token, region, employees }
}

async function findRegion(email: string): Promise<string> {
  const response = await fetch(`${LOGIN_FINDER_URL}${PRE_LOGIN_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const json = response.ok
    ? ((await response.json()) as { data?: { region?: string } })
    : null
  const region = json?.data?.region
  if (!region) {
    throw new Error('Could not determine region for this email')
  }

  return region
}

/** Same parsing as the SDK's me-oauth handling in `directLogin()`. */
async function getEmployees(baseUrl: string, token: string): Promise<TwoFactorEmployee[]> {
  const response = await fetch(`${baseUrl}${ME_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`Could not retrieve employee details: HTTP ${response.status}`)
  }

  const json = (await response.json()) as { data?: unknown }
  const entries = Array.isArray(json.data) ? json.data : [json.data]

  const employees = entries
    .map((entry): TwoFactorEmployee | null => {
      const record = entry as Record<string, unknown> | null
      const emp = (record?.employee ?? record) as
        | {
            id?: string
            fullName?: { firstName?: string; lastName?: string }
            companyView?: { id?: string; name?: string }
          }
        | null
      if (!emp?.id) return null

      return {
        id: emp.id,
        companyId: emp.companyView?.id ?? '',
        companyName: emp.companyView?.name ?? '',
        firstName: emp.fullName?.firstName ?? '',
        lastName: emp.fullName?.lastName ?? '',
      }
    })
    .filter((e): e is TwoFactorEmployee => e !== null)

  if (employees.length === 0) {
    throw new Error('Could not retrieve employee details')
  }

  return employees
}
