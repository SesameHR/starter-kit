'use client'

import { useEffect } from 'react'
import { reportStudioAppError } from '@/lib/studio-error-reporter'
import './globals.css'

// Studio: what the app shows when its root layout itself crashes, and the crash
// told to Cowork's preview (src/lib/studio-error-reporter.ts). It replaces the
// layout, translations included, so its few words are written here.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportStudioAppError(error, 'boundary')
  }, [error])

  return (
    <html lang="es">
      <body>
        <div role="alert" className="mx-auto mt-16 max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <h1 className="text-lg font-bold text-destructive">Algo ha ido mal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ha habido un problema al cargar la app. Inténtalo de nuevo.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
