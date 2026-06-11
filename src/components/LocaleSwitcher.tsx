'use client'

import { useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { setLocaleAction } from '@/i18n/actions'
import { localeNames, locales, type Locale } from '@/i18n/config'

export function LocaleSwitcher() {
  const locale = useLocale()
  const t = useTranslations('common')
  const [pending, startTransition] = useTransition()

  return (
    <select
      aria-label={t('language')}
      value={locale}
      disabled={pending}
      onChange={(event) =>
        startTransition(() => setLocaleAction(event.target.value as Locale))
      }
      className="cursor-pointer rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      {locales.map((value) => (
        <option key={value} value={value}>
          {localeNames[value]}
        </option>
      ))}
    </select>
  )
}
