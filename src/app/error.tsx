'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { reportStudioAppError } from '@/lib/studio-error-reporter'

// Studio: what a page shows when it crashes, and the crash told to Cowork's
// preview (src/lib/studio-error-reporter.ts), which offers to have it fixed.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('dashboard.error')

  useEffect(() => {
    reportStudioAppError(error, 'boundary')
  }, [error])

  return (
    <div role="alert" className="mx-auto mt-16 max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
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
