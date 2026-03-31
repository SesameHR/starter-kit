'use server'

import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function selectEmployeeAction(formData: FormData) {
  const employeeId = formData.get('employeeId') as string
  if (!employeeId) return

  const session = await getSession()

  const selected = session.employees?.find((e) => e.id === employeeId)
  if (!selected) {
    redirect('/login')
  }

  session.employeeId = selected.id
  session.companyId = selected.companyId
  session.employeeName = selected.fullName
  // Clean up — no longer needed in session
  delete session.employees
  await session.save()

  redirect('/dashboard')
}
