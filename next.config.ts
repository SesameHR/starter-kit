import type { NextConfig } from 'next'
import path from 'path'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  // Studio: allow the Cowork SPA origin to reach the dev server (HMR, server
  // actions) when the preview runs cross-origin inside an iframe. Comma-separated
  // list of origins; unset (standalone) keeps Next.js's same-origin default.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(',')
    : undefined,
}

export default withNextIntl(nextConfig)
