export const locales = ['en', 'es'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const LOCALE_COOKIE = 'NEXT_LOCALE'

// Native names, shown as-is in the language switcher regardless of active locale
export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
}
