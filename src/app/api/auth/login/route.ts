import { NextResponse } from 'next/server'
import { getSSOClient } from '@/lib/oauth'

export async function GET() {
  const sso = getSSOClient()
  if (!sso) {
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 500 })
  }

  const { url, state } = sso.getLoginUrl({ scope: 'openid profile email' })

  const response = NextResponse.redirect(url)
  response.cookies.set('oauth-state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  return response
}
