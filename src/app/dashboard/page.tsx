import { getSesame, withAuth } from '@/lib/sesame'

export default async function DashboardPage() {
  const sdk = await getSesame()
  const me = await withAuth(sdk.employees.me())
  const firstName = me.firstName

  return (
    <div>
      <h1>{firstName ? `Hi, ${firstName}` : 'Dashboard'}</h1>
    </div>
  )
}
