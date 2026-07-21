import { NextResponse } from 'next/server'

/**
 * Reject anything that is not a plain app-internal path.
 *
 * Two shapes are dangerous, and both are paths a browser resolves as a different
 * ORIGIN rather than as a path on ours:
 *
 * - `//evil.com` and `/\evil.com` — protocol-relative references.
 * - `/<TAB>/evil.com` — the URL parser strips tab, LF and CR from anywhere in a
 *   reference *before* parsing it, so the leading `/` is discarded and what is
 *   left parses as protocol-relative. `Headers` only rejects CR and LF, so a tab
 *   travels intact all the way to the browser. (curl does not strip tabs, which
 *   is why this shape survives naive testing.)
 *
 * Coerces to `/` instead of throwing: every caller passes a literal we wrote, so
 * a rejection here means a bug in our own code, and sending the user to the app
 * root is a better production outcome than a 500. The `console.error` is what
 * makes it visible.
 */
function safePath(path: string): string {
  if (/^\/(?![/\\])/.test(path) && !/[\u0000-\u001F\u007F]/.test(path)) {
    return path
  }
  console.error(`redirectToPath: refusing to redirect to a non-internal path: ${JSON.stringify(path)}`)
  return '/'
}

/**
 * Redirect the browser to a path on this app's own origin.
 *
 * The `Location` header is sent as a *relative* reference, which RFC 7231 §7.1.2
 * explicitly allows. The browser resolves it against the URL it actually
 * requested, so the redirect lands on whatever origin the user is really using:
 * the public one behind an edge proxy (e.g. Railway), `localhost` in dev.
 *
 * That is the entire point — we never compute an origin, so there is no origin
 * to get wrong and none to spoof. Both alternatives are broken:
 *
 * - `new URL(path, request.url)` sends the browser to the proxy's INTERNAL bind
 *   address (`https://localhost:3000`), i.e. a dead host.
 * - Reading `x-forwarded-host` lets whoever sets that header choose the
 *   destination. It is not only set by our proxy: Next derives it from the plain
 *   `Host` header when no proxy is present, so it is attacker-controlled in
 *   exactly the deployments that have nothing in front to overwrite it.
 *
 * `NextResponse.redirect()` cannot be used here: it runs `Location` through
 * `validateURL()`, which throws on anything that is not an absolute URL.
 *
 * 307 preserves the request method. Every caller is a GET handler, so this is
 * GET → GET.
 *
 * @param path an app-internal path *we* wrote — never user input.
 */
export function redirectToPath(path: `/${string}`): NextResponse {
  return new NextResponse(null, {
    status: 307,
    headers: { Location: safePath(path) },
  })
}
