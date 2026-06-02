import { getSesame, withAuth } from '@/lib/sesame'

export default async function DashboardPage() {
  const sdk = await getSesame()
  const me = await withAuth(sdk.employees.me())
  const firstName = me.firstName

  return (
    <div className="animate-reveal">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {firstName ? `Hi, ${firstName}` : 'Dashboard'}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Your starter kit is ready — build your pages with the Sesame SDK.
      </p>
    </div>
  )
}
