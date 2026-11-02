/**
 * Studio: tells Cowork that the app crashed, so its preview can offer to have
 * the agent fix it.
 *
 * Posts `{ source, type: 'app-error', version, kind, message, stack }` to the
 * window that frames the preview, and only to the origin Studio names in
 * `NEXT_PUBLIC_STUDIO_PARENT_ORIGIN` (never `*`). Inert everywhere else: a
 * published app has no such variable, and a page that is not framed has no
 * parent to tell. Cowork treats what it receives as untrusted text.
 *
 * Bounded: the same error is sent once per 10 s, at most one a second and 20
 * per page load, and the browser's noise ("Script error." without a stack,
 * "ResizeObserver loop …") is never sent.
 *
 * Framework-free: the window error listeners are installed from
 * `src/instrumentation-client.ts`, and the error boundaries (`src/app/error.tsx`,
 * `src/app/global-error.tsx`) report what they catch.
 */

export type StudioAppErrorKind = 'boundary' | 'error' | 'unhandledrejection'

export interface StudioAppErrorMessage {
  source: 'sesame-studio-app'
  type: 'app-error'
  version: 1
  kind: StudioAppErrorKind
  message: string
  stack: string | null
}

/** The parts of `window` the reporter uses: a test hands in its own. */
export interface StudioReporterWindow {
  readonly parent: unknown
  addEventListener(type: 'error' | 'unhandledrejection', listener: (event: Event) => void): void
}

export interface StudioErrorReporter {
  /** Send one error, unless it is noise, a repeat or over the limits. */
  report(error: unknown, kind: StudioAppErrorKind): void
  /** Listen to the window's uncaught errors and unhandled rejections (once). */
  install(): void
}

export const STUDIO_ERROR_LIMITS = {
  messageChars: 500,
  stackChars: 4000,
  repeatWindowMs: 10_000,
  minIntervalMs: 1_000,
  perPage: 20,
} as const

const SOURCE = 'sesame-studio-app'
const EMPTY_MESSAGE = 'Error'
const NOISE = [/^Script error\.?$/, /^ResizeObserver loop/]

interface Postable {
  postMessage(message: unknown, targetOrigin: string): void
}

interface Described {
  message: string
  stack: string | null
}

/** The origin, when `value` is exactly an http(s) origin; null otherwise. */
function originOf(value: string | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    const isWeb = url.protocol === 'https:' || url.protocol === 'http:'
    return isWeb && url.origin === value ? value : null
  } catch {
    return null
  }
}

function text(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return String(value)
  } catch {
    return ''
  }
}

/** What an error, a rejection reason or an `ErrorEvent` says, as plain text. */
function describe(error: unknown): Described {
  if (error instanceof Error) {
    return { message: text(error.message), stack: typeof error.stack === 'string' ? error.stack : null }
  }
  if (error === null || error === undefined) return { message: '', stack: null }
  return { message: text(error), stack: null }
}

function isNoise({ message, stack }: Described): boolean {
  return stack === null && NOISE.some((pattern) => pattern.test(message))
}

export function createStudioErrorReporter({
  win,
  parentOrigin,
  now,
}: {
  win: StudioReporterWindow
  parentOrigin: string | undefined
  now: () => number
}): StudioErrorReporter {
  const target = originOf(parentOrigin)
  const parent = win.parent !== win ? (win.parent as Postable | null) : null
  const lastSentAt = new Map<string, number>()
  let sent = 0
  let lastPostAt = Number.NEGATIVE_INFINITY
  let isInstalled = false

  function report(error: unknown, kind: StudioAppErrorKind): void {
    if (target === null || parent === null || sent >= STUDIO_ERROR_LIMITS.perPage) return
    const described = describe(error)
    if (isNoise(described)) return
    const message =
      described.message.trim().slice(0, STUDIO_ERROR_LIMITS.messageChars) || EMPTY_MESSAGE
    const at = now()
    const key = `${kind}\n${message}`
    const previous = lastSentAt.get(key)
    if (previous !== undefined && at - previous < STUDIO_ERROR_LIMITS.repeatWindowMs) return
    if (at - lastPostAt < STUDIO_ERROR_LIMITS.minIntervalMs) return
    const payload: StudioAppErrorMessage = {
      source: SOURCE,
      type: 'app-error',
      version: 1,
      kind,
      message,
      stack: described.stack === null ? null : described.stack.slice(0, STUDIO_ERROR_LIMITS.stackChars),
    }
    try {
      parent.postMessage(payload, target)
    } catch {
      // Reporting an error must never raise another one.
      return
    }
    sent += 1
    lastPostAt = at
    lastSentAt.set(key, at)
  }

  function install(): void {
    if (isInstalled || target === null || parent === null) return
    isInstalled = true
    win.addEventListener('error', (event) => {
      const { error, message } = event as ErrorEvent
      report(error ?? message, 'error')
    })
    win.addEventListener('unhandledrejection', (event) => {
      report((event as PromiseRejectionEvent).reason, 'unhandledrejection')
    })
  }

  return { report, install }
}

let shared: StudioErrorReporter | null | undefined

function sharedReporter(): StudioErrorReporter | null {
  if (shared === undefined) {
    shared =
      typeof window === 'undefined'
        ? null
        : createStudioErrorReporter({
            win: window,
            // Written out in full: Next inlines NEXT_PUBLIC_ variables by name.
            parentOrigin: process.env.NEXT_PUBLIC_STUDIO_PARENT_ORIGIN,
            now: () => Date.now(),
          })
  }
  return shared
}

/** Report an error an error boundary caught. */
export function reportStudioAppError(error: unknown, kind: StudioAppErrorKind): void {
  sharedReporter()?.report(error, kind)
}

/** Report the window's uncaught errors and unhandled rejections from now on. */
export function installStudioErrorReporter(): void {
  sharedReporter()?.install()
}
