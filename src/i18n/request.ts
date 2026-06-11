import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { defaultLocale, LOCALE_COOKIE, locales, type Locale } from './config'

function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale)
}

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value
  let locale = isLocale(cookieLocale) ? cookieLocale : undefined

  if (!locale) {
    // First visit: negotiate from the browser's Accept-Language header
    const acceptLanguage = (await headers()).get('accept-language') ?? ''
    locale = acceptLanguage
      .split(',')
      .map((part) => part.split(';')[0].trim().toLowerCase().split('-')[0])
      .find(isLocale)
  }

  locale ??= defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
