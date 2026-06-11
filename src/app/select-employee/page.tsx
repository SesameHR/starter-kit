import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getSession } from '@/lib/session'
import { SesameMark } from '@/components/SesameLogo'
import { selectEmployeeAction } from './actions'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default async function SelectEmployeePage() {
  const t = await getTranslations('selectEmployee')
  const session = await getSession()

  if (!session.token) redirect('/login')
  if (!session.employees?.length) redirect('/dashboard')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2.5">
          <SesameMark size={40} />
          <span className="font-sans text-xl font-bold lowercase leading-none tracking-tight text-foreground">sesame</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>

          <ul className="mt-6 space-y-2">
            {session.employees.map((emp) => (
              <li key={emp.id}>
                <form action={selectEmployeeAction}>
                  <input type="hidden" name="employeeId" value={emp.id} />
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-brand/40 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {initials(emp.fullName)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-foreground">{emp.fullName}</div>
                      <div className="truncate text-[13px] text-muted-foreground">{emp.companyName}</div>
                    </div>
                    <span className="ml-auto text-muted-foreground" aria-hidden>
                      →
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
