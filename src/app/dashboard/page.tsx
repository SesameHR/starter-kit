import { getTranslations } from 'next-intl/server'
import { getSesame, withAuth } from '@/lib/sesame'

export default async function DashboardPage() {
  const t = await getTranslations('dashboard')
  const sdk = await getSesame()
  const me = await withAuth(sdk.employees.me())
  const firstName = me.firstName

  return (
    <div className="animate-reveal">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {firstName ? t('greeting', { name: firstName }) : t('title')}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{t('intro')}</p>
    </div>
  )
}
