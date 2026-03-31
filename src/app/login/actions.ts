'use server'

import { SesameSDK } from '@sesamehr/sdk'
import { getSession, type EmployeeOption } from '@/lib/session'
import { redirect } from 'next/navigation'

export interface LoginState {
  error?: string
}

export async function loginAction(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  try {
    const { details } = await SesameSDK.loginWithDetails({ email, password })

    const session = await getSession()
    session.token = details.token
    session.region = details.region

    if (details.employees.length > 1) {
      // Multiple employees — let user choose
      session.employees = details.employees.map(
        (emp): EmployeeOption => ({
          id: emp.id,
          companyId: emp.companyId,
          companyName: emp.companyName,
          fullName: `${emp.firstName} ${emp.lastName}`.trim(),
        }),
      )
      await session.save()
    } else {
      // Single employee — go straight to dashboard
      const emp = details.employee
      session.employeeId = emp.id
      session.companyId = emp.companyId
      session.employeeName = `${emp.firstName} ${emp.lastName}`.trim()
      await session.save()
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Login failed. Check your credentials.'
    return { error: message }
  }

  // Check where to redirect after session is saved
  const session = await getSession()
  if (session.employees && !session.employeeId) {
    redirect('/select-employee')
  }

  redirect('/dashboard')
}
