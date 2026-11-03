import { getTranslations } from 'next-intl/server'
import { SesameMark } from '@/components/SesameLogo'
import { getSession } from '@/lib/session'
import { LogoutButton } from '../dashboard/logout-button'

/**
 * The back office: every page under /admin. Add a `page.tsx` here to give the
 * app one; until then /admin is a 404.
 *
 * Who may see these pages is not decided here but in the middleware, which
 * holds every request to /admin to `@/lib/back-office`. A Server Action is not
 * covered by it: each one calls `requireBackOffice()` itself.
 */
export default async function BackOfficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  const t = await getTranslations('backOffice')
  const tc = await getTranslations('common')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <SesameMark size={28} />
            <span className="font-sans text-lg font-bold tracking-tight text-foreground">{tc('appName')}</span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {t('badge')}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {session.employeeName && (
              <span className="hidden text-[12.5px] font-bold uppercase tracking-wide text-foreground md:inline">
                {session.employeeName}
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-5 py-6 sm:px-8">{children}</main>
    </div>
  )
}
