'use client'

import { Suspense, useActionState, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { SesameMark } from '@/components/SesameLogo'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { OtpInput } from '@/components/OtpInput'
import { loginAction, twoFactorAction, type LoginState } from './actions'

const inputClass =
  'w-full rounded-2xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'

function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="mb-4 rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
      {message}
    </div>
  )
}

function TwoFactorStep({
  email,
  password,
  onBack,
}: {
  email: string
  password: string
  onBack: () => void
}) {
  const t = useTranslations('login.twoFactor')
  const [state, formAction, pending] = useActionState<LoginState | null, FormData>(
    twoFactorAction,
    null,
  )

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-foreground">{t('title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>

      <div className="mt-6">
        {state?.error && <ErrorAlert message={state.error} />}

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="password" value={password} />
          <OtpInput
            name="code"
            disabled={pending}
            invalid={!!state?.error}
            digitLabel={(position) => t('codeDigit', { position })}
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? t('verifying') : t('verify')}
          </button>
        </form>

        <div className="mt-6 border-t border-divider pt-5 text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-brand transition-opacity hover:opacity-80"
          >
            {t('back')}
          </button>
        </div>
      </div>
    </>
  )
}

function LoginCard() {
  const t = useTranslations('login')
  const [loginState, loginFormAction, loginPending] = useActionState<LoginState | null, FormData>(
    loginAction,
    null,
  )

  // Credentials live in React state so the two-factor step can resend them
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  // Bumped on each entry into the two-factor step so it remounts with a clean slate
  const [twoFactorEpoch, setTwoFactorEpoch] = useState(0)

  useEffect(() => {
    if (loginState?.requiresTwoFactor) {
      setShowTwoFactor(true)
      setTwoFactorEpoch((epoch) => epoch + 1)
    }
  }, [loginState])

  const searchParams = useSearchParams()
  const oauthError = searchParams.get('error')
  const oauthEnabled = searchParams.get('oauth') !== '0'

  // `?error=` comes straight from the URL, so only ever render it as a lookup key:
  // an unknown value falls back to a generic message instead of being displayed.
  // Echoing it would let a link put attacker-chosen text inside the app's own
  // error alert — not XSS (React escapes it), but credible phishing on our domain.
  const loginErrorMessage =
    loginState?.error ||
    (oauthError
      ? t.has(`errors.${oauthError}`)
        ? t(`errors.${oauthError}`)
        : t('errors.auth_failed')
      : null)

  if (showTwoFactor) {
    return (
      <TwoFactorStep
        key={twoFactorEpoch}
        email={email}
        password={password}
        onBack={() => setShowTwoFactor(false)}
      />
    )
  }

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-foreground">{t('title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>

      <div className="mt-6">
        {loginErrorMessage && <ErrorAlert message={loginErrorMessage} />}

        <form action={loginFormAction} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[13px] font-medium text-foreground">
              {t('email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[13px] font-medium text-foreground">
              {t('password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loginPending}
            className="w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loginPending ? t('submitting') : t('submit')}
          </button>
        </form>

        {oauthEnabled && (
          <>
            <div className="my-5 flex items-center gap-3 text-[12px] text-muted-foreground">
              <span className="h-px flex-1 bg-divider" />
              {t('or')}
              <span className="h-px flex-1 bg-divider" />
            </div>
            <a
              href="/api/auth/login"
              className="flex w-full items-center justify-center rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {t('sso')}
            </a>
          </>
        )}
      </div>
    </>
  )
}

export default function LoginPage() {
  const tCommon = useTranslations('common')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2.5">
          <SesameMark size={40} />
          <span className="font-sans text-xl font-bold lowercase leading-none tracking-tight text-foreground">sesame</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
          <Suspense>
            <LoginCard />
          </Suspense>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <LocaleSwitcher />
          <p className="text-center text-[11.5px] text-muted-foreground">{tCommon('builtWith')}</p>
        </div>
      </div>
    </div>
  )
}
