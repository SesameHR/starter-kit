import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PLACEHOLDER_SECRET = 'change-me-to-a-random-32-char-string-at-least'
const cookieName = process.env.SESSION_COOKIE_NAME || 'sesame-session'

// Validate SESSION_SECRET once on first request (middleware never runs during build)
let secretChecked = false
function ensureSecureSecret() {
  if (secretChecked) return
  secretChecked = true
  if (process.env.NODE_ENV !== 'production') return
  const secret = process.env.SESSION_SECRET
  if (!secret || secret === PLACEHOLDER_SECRET || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET must be a random string of at least 32 characters in production. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    )
  }
}

export function middleware(request: NextRequest) {
  ensureSecureSecret()

  const { searchParams, pathname } = request.nextUrl

  // --- Auto-login detection: redirect ?token=X&sesameRegion=Y to the handler ---
  const token = searchParams.get('token')
  const sesameRegion = searchParams.get('sesameRegion')
  if (token && sesameRegion && pathname !== '/api/auth/auto-login') {
    const autoLoginUrl = new URL('/api/auth/auto-login', request.url)
    autoLoginUrl.searchParams.set('token', token)
    autoLoginUrl.searchParams.set('sesameRegion', sesameRegion)
    return NextResponse.redirect(autoLoginUrl)
  }

  // --- Auth guard for protected routes ---
  const isProtected = pathname.startsWith('/dashboard') || pathname === '/select-employee'
  if (isProtected) {
    const session = request.cookies.get(cookieName)
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
