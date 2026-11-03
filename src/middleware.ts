import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { readBackOfficeVerdict } from '@/lib/back-office-mark'

const PLACEHOLDER_SECRET = 'change-me-to-a-random-32-char-string-at-least'
const cookieName = process.env.SESSION_COOKIE_NAME || 'sesame-session'

// The back office's own address: a bare host name (`portal-admin.example.com`).
// When set, that host serves only the back office (/admin) and the sign-in it
// needs, and every other host answers /admin with a 404: each audience gets its
// own address. Unset (local dev, a preview), /admin is reachable on any host.
// Routing only: who gets into the back office is decided further down.
const backOfficeHost = process.env.BACK_OFFICE_HOST?.trim().toLowerCase() || undefined
// What the back-office host shares with the app besides /api and the static
// assets the matcher already skips: signing in and choosing an account.
const SHARED_PATHS = new Set(['/login', '/select-employee'])
// A file served from the app root (`/icon.svg`), never a page.
const FILE_PATH = /\.[a-z0-9]+$/i

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

export async function middleware(request: NextRequest) {
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

  // --- One address for the app, another for its back office ---
  if (backOfficeHost) {
    const onBackOfficeHost = requestHost(request) === backOfficeHost
    if (!onBackOfficeHost && isBackOfficePath(pathname)) {
      return new NextResponse(null, { status: 404 })
    }
    if (onBackOfficeHost && !isBackOfficePath(pathname) && !SHARED_PATHS.has(pathname) && !FILE_PATH.test(pathname)) {
      // `/` included: a sign-in or a Cowork launch lands there.
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // --- Auth guard for protected routes ---
  const isProtected =
    pathname.startsWith('/dashboard') || pathname === '/select-employee' || isBackOfficePath(pathname)
  if (isProtected) {
    const session = request.cookies.get(cookieName)
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // --- The back office: only for those @/lib/back-office lets in ---
  // Held here, on every request, and not in its layout: Next renders a page
  // alongside its layout and sends it even when the layout leaves it out, and
  // a Server Action posted to a back-office path answers with that page.
  if (isBackOfficePath(pathname)) {
    const verdict = await readBackOfficeVerdict(request)
    if (verdict === 'allowed') return NextResponse.next()
    const isRead = request.method === 'GET' || request.method === 'HEAD'
    if (!isRead) return new NextResponse(null, { status: 403 })
    if (verdict === 'refused') return NextResponse.rewrite(new URL('/admin/no-access', request.url))
    const check = new URL('/api/auth/back-office', request.url)
    check.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(check)
  }

  return NextResponse.next()
}

function isBackOfficePath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

// The host the browser asked for, without its port. Behind the edge proxy this
// is the public name the request was routed by.
function requestHost(request: NextRequest): string {
  return (request.headers.get('host') ?? '').split(':')[0].toLowerCase()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
