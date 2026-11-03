import { getTranslations } from 'next-intl/server'

/** What the middleware shows, at the address asked for, to whoever the back office does not let in. */
export default async function BackOfficeNoAccessPage() {
  const t = await getTranslations('backOffice.noAccess')

  return (
    <div className="animate-reveal">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{t('description')}</p>
    </div>
  )
}
