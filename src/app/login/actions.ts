'use server'

import { SesameSDK } from '@sesamehr/sdk'
import { getTranslations } from 'next-intl/server'
import { getSession, type EmployeeOption } from '@/lib/session'
import {
  InvalidTwoFactorCodeError,
  loginWithTwoFactor,
  twoFactorStatus,
  TWO_FACTOR_CODE_LENGTH,
  type TwoFactorEmployee,
} from '@/lib/two-factor'
import { redirect } from 'next/navigation'

export interface LoginState {
  error?: string
  /** Sesame asked for a TOTP code — show the two-factor step. */
  requiresTwoFactor?: boolean
}

/** Persist the login result in the session (single or multi-employee). */
async function saveLoginSession(
  token: string,
  region: string,
  employees: TwoFactorEmployee[],
): Promise<void> {
  const session = await getSession()
  session.token = token
  session.region = region

  if (employees.length > 1) {
    // Multiple employees — let user choose
    session.employees = employees.map(
      (emp): EmployeeOption => ({
        id: emp.id,
        companyId: emp.companyId,
        companyName: emp.companyName,
        fullName: `${emp.firstName} ${emp.lastName}`.trim(),
      }),
    )
  } else {
    // Single employee — go straight to dashboard
    const emp = employees[0]
    session.employeeId = emp.id
    session.companyId = emp.companyId
    session.employeeName = `${emp.firstName} ${emp.lastName}`.trim()
  }

  await session.save()
}

/** Redirect to employee selection or dashboard once the session is saved. */
async function redirectAfterLogin(): Promise<never> {
  const session = await getSession()
  if (session.employees && !session.employeeId) {
    redirect('/select-employee')
  }

  redirect('/dashboard')
}

export async function loginAction(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const t = await getTranslations('login.errors')
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: t('missing_credentials') }
  }

  try {
    const { details } = await SesameSDK.loginWithDetails({ email, password })
    await saveLoginSession(details.token, details.region, details.employees)
  } catch (err) {
    const twoFactor = twoFactorStatus(err)
    if (twoFactor === 'configured') {
      return { requiresTwoFactor: true }
    }
    if (twoFactor === 'not_configured') {
      return { error: t('two_factor_not_configured') }
    }

    // Don't surface raw API error messages (untranslated, e.g. "Unprocessable entity")
    console.error('Login failed:', err)
    return { error: t('login_failed') }
  }

  return redirectAfterLogin()
}

export async function twoFactorAction(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const t = await getTranslations('login.errors')
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const code = formData.get('code') as string

  if (!email || !password) {
    return { error: t('missing_credentials') }
  }
  if (!new RegExp(`^\\d{${TWO_FACTOR_CODE_LENGTH}}$`).test(code ?? '')) {
    return { requiresTwoFactor: true, error: t('invalid_two_factor_code') }
  }

  try {
    const result = await loginWithTwoFactor({ email, password, code })
    await saveLoginSession(result.token, result.region, result.employees)
  } catch (err) {
    if (err instanceof InvalidTwoFactorCodeError) {
      return { requiresTwoFactor: true, error: t('invalid_two_factor_code') }
    }

    console.error('Two-factor login failed:', err)
    return { requiresTwoFactor: true, error: t('login_failed') }
  }

  return redirectAfterLogin()
}
