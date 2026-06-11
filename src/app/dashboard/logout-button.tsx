'use client'

import { useTranslations } from 'next-intl'
import { logoutAction } from './actions'

export function LogoutButton() {
  const t = useTranslations('dashboard')

  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {t('signOut')}
      </button>
    </form>
  )
}
