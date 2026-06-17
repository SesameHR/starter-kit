import type { NextRequest } from 'next/server'

/**
 * Build an absolute URL on the app's PUBLIC origin.
 *
 * Behind an edge proxy (e.g. Railway), a Route Handler's `request.url` reports
 * the internal bind address (e.g. `https://localhost:3000`), so a redirect built
 * from it sends the browser to a dead host. The original host and scheme survive
 * in the `x-forwarded-host` / `x-forwarded-proto` headers the proxy sets — prefer
 * those, and fall back to `request.url` for local dev where no proxy is present.
 *
 * (Middleware does NOT need this: `request.url` there already reflects the public
 * origin. Only Node Route Handlers see the internal address.)
 */
export function publicUrl(path: string, request: NextRequest): URL {
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (!forwardedHost) {
    return new URL(path, request.url)
  }
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  return new URL(path, `${forwardedProto}://${forwardedHost}`)
}
