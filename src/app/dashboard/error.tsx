'use client'

import { useTranslations } from 'next-intl'

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('dashboard.error')

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <h1 className="text-lg font-bold text-destructive">{t('title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t('retry')}
      </button>
    </div>
  )
}
