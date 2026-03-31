import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { selectEmployeeAction } from './actions'

export default async function SelectEmployeePage() {
  const session = await getSession()

  if (!session.token) redirect('/login')
  if (!session.employees?.length) redirect('/dashboard')

  return (
    <div>
      <h1>Select account</h1>
      <p>You belong to multiple companies</p>

      <div>
        {session.employees.map((emp) => (
          <form key={emp.id} action={selectEmployeeAction}>
            <input type="hidden" name="employeeId" value={emp.id} />
            <button type="submit">
              <div>{emp.fullName}</div>
              <div>{emp.companyName}</div>
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}
