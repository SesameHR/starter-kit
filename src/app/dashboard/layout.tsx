import { getSession } from '@/lib/session'
import { LogoutButton } from './logout-button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <div>
      <header>
        <span>{session.employeeName}</span>
        <LogoutButton />
      </header>
      <main>{children}</main>
    </div>
  )
}
