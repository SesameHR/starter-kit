import { getTranslations } from 'next-intl/server'
import { getSession } from '@/lib/session'
import { SesameMark } from '@/components/SesameLogo'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { LogoutButton } from './logout-button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  const t = await getTranslations('common')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <SesameMark size={28} />
            <span className="font-sans text-lg font-bold tracking-tight text-foreground">{t('appName')}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {session.employeeName && (
              <span className="hidden text-[12.5px] font-bold uppercase tracking-wide text-foreground md:inline">
                {session.employeeName}
              </span>
            )}
            <LocaleSwitcher />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-5 py-6 sm:px-8">{children}</main>
    </div>
  )
}
