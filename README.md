# sesame-starter-kit

Next.js template with `@sesamehr/sdk` — login, sessions, and dashboard ready to go.

## Setup

```bash
# 1. Clone the template
git clone <this-repo> my-app && cd my-app

# 2. Install dependencies
npm install

# 3. Configure
cp .env.example .env.local
# Edit .env.local — set SESSION_SECRET (required) and OAuth vars (optional)

# 4. Run
npm run dev
```

Open http://localhost:3000 and sign in with your Sesame HR credentials.

## Authentication

Three login methods:

### Direct login (default)
Email + password against Sesame API. No setup needed beyond `SESSION_SECRET`.

Accounts with Sesame two-step verification (TOTP) work automatically: when the
API reports `double_factor_authentication_active_and_configured`, the login form
switches to a 6-digit code step and completes the login via the double-factor
endpoint (see `src/lib/two-factor.ts`). If 2FA is enforced for the account but
not yet configured, the user is told to set it up in the Sesame app first.

### OAuth SSO (optional)
Add all three vars to `.env.local` to enable the "Sign in with Sesame SSO" button:

```env
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

All three are required together — the app will throw if only some are set.

### Auto-login (built-in)
Sesame HR can redirect users to your app with a single-use token:

```
https://myapp.com/?token=abc123&sesameRegion=back-eu1
```

The middleware detects the `token` + `sesameRegion` params on any URL, exchanges the token with the Sesame API, creates a session, and redirects to `/dashboard`. No configuration needed — it works automatically.

### Cowork embed (launch ticket, optional)
Run this app embedded in the **Cowork Apps hub** with single sign-on — the user
opens it from the hub and lands logged in, no login screen inside the iframe.

Set both vars in `.env.local` to enable it:

```env
COWORK_BACKEND_URL=https://api-cowork.sesametime.com   # Cowork backend origin, no trailing slash
LAUNCH_SHARED_SECRET=your-per-app-shared-secret        # must match the app's external_apps.launch_secret
```

How it works: Cowork mints a single-use `ticket` and loads this app in an iframe
at `/api/auth/launch?ticket=…`. The handler redeems the ticket server-to-server
against `POST {COWORK_BACKEND_URL}/apps/redeem-ticket` (authenticated with
`X-Launch-Secret: LAUNCH_SHARED_SECRET`), receives the user's Sesame credentials,
starts the session, and redirects to `/dashboard`. The opaque ticket is the only
thing on the URL; the real token is exchanged server-side into the httpOnly
cookie. Sessions started this way are flagged `embedded: true`.

With either var unset the route fails closed to `/login?error=launch_failed`, so
the standard logins above keep working unchanged.

To register the app on the Cowork side, add a row to its `external_apps` table
with this app's public origin as `base_url` and the same secret as
`launch_secret`. The origin must be allowed by Cowork's iframe CSP
(`frame-src`) — `*.sesametime.com` is allowed out of the box.

## Multi-company support

If a user belongs to multiple companies, they'll see an account selector after login. The selected employee/company is stored in the encrypted session cookie.

## Project structure

```
messages/
├── en.json                  # English UI strings
└── es.json                  # Spanish UI strings
src/
├── lib/
│   ├── session.ts          # iron-session config + getSession()
│   ├── sesame.ts           # getSesame() → authenticated SDK from session
│   ├── two-factor.ts       # Sesame TOTP login (2FA detection + second step)
│   ├── request-url.ts      # publicUrl() → proxy-correct absolute redirects
│   └── oauth.ts            # SesameSSO client (only if OAuth vars are set)
├── i18n/
│   ├── config.ts           # Supported locales, default locale, cookie name
│   ├── request.ts          # Locale resolution: cookie → Accept-Language → default
│   └── actions.ts          # Server Action: persist locale in cookie
├── middleware.ts            # Protects /dashboard/* + validates SESSION_SECRET in prod
├── components/
│   ├── SesameLogo.tsx      # Sesame isotipo (SVG mark) used in the chrome
│   ├── LocaleSwitcher.tsx  # Language selector (login + dashboard header)
│   └── OtpInput.tsx        # Segmented 6-digit code input (2FA step)
├── types/
│   └── oauth-client.d.ts   # Type declarations for @sesamehr/oauth-client
└── app/
    ├── page.tsx             # Root → redirect to /dashboard or /login
    ├── login/
    │   ├── page.tsx         # Login form + optional OAuth button
    │   └── actions.ts       # Server Action: login + save session
    ├── select-employee/
    │   ├── page.tsx         # Company/employee selector (multi-company)
    │   └── actions.ts       # Server Action: select employee
    ├── dashboard/
    │   ├── layout.tsx       # Header with employee name + logout
    │   ├── page.tsx         # Example: SDK usage
    │   ├── actions.ts       # Server Action: logout
    │   ├── error.tsx        # Error boundary for SDK/network failures
    │   ├── loading.tsx      # Loading state while fetching data
    │   └── logout-button.tsx
    └── api/auth/
        ├── login/route.ts     # GET: redirect to SSO
        ├── callback/route.ts  # GET: handle OAuth callback
        ├── auto-login/route.ts # GET: handle auto-login token exchange
        ├── launch/route.ts    # GET: Cowork launch-ticket redeem → session
        └── logout/route.ts    # GET: destroy session → /login
```

## Styling

The kit ships with a small, opinionated design system built on **Tailwind CSS v4**
and the **Inter** font, themed after the Sesame Cowork Hub (navy `#2B3674`, teal
`#4FD1C5`, page `#F4F7FE`). All design tokens live in `src/app/globals.css` as a
`@theme` block, exposed as semantic utilities you can use directly:

```tsx
<div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
  <h2 className="text-foreground">Title</h2>
  <p className="text-muted-foreground">Body</p>
  <button className="bg-primary text-primary-foreground">Primary</button>
  <span className="text-brand">Accent</span>
</div>
```

Available tokens: `background`, `foreground`, `card`, `primary`, `brand`, `muted`,
`accent`, `border`, `input`, `divider`, `ring`, plus `success` / `warning` /
`destructive` / `info`. To re-theme the whole app, edit the colour values in
`globals.css` — every page follows automatically. Helpers included: `.skeleton`
(shimmer placeholder), `.tnum` (tabular numerals), `.scroll-thin`, and the
`animate-reveal` / `animate-fade-in` utilities.

## Internationalization (i18n)

The kit ships fully translated with [next-intl](https://next-intl.dev) — no
hardcoded UI strings. English and Spanish are included out of the box.

**How the locale is resolved** (no locale prefix in URLs):

1. `NEXT_LOCALE` cookie — set when the user picks a language in the `LocaleSwitcher`
2. The browser's `Accept-Language` header (first visit)
3. Default locale (`en`)

**Using translations in your pages:**

```tsx
// Server Components / Server Actions
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('dashboard')
return <h1>{t('greeting', { name: firstName })}</h1>

// Client Components
import { useTranslations } from 'next-intl'
const t = useTranslations('dashboard')
```

**Adding strings:** add the key to both `messages/en.json` and `messages/es.json`,
under one namespace per feature. Interpolation uses ICU syntax: `"greeting": "Hi, {name}"`.

**Adding a language:** create `messages/<locale>.json` and add the locale to
`locales` and `localeNames` in `src/i18n/config.ts` — the switcher and the
resolution logic pick it up automatically.

## SDK reference

For all available methods, response types, pagination, and filters, read the SDK documentation:

```
node_modules/@sesamehr/sdk/README.md
```

## Using the SDK in pages

```typescript
import { getSesame, withAuth } from '@/lib/sesame'

export default async function MyPage() {
  const sdk = await getSesame()
  // withAuth() catches expired tokens and redirects to /login
  const employees = await withAuth(sdk.employees.list({ limit: 20, offset: 0 }))
  // ...
}
```

- `getSesame()` — returns authenticated SDK, redirects to /login if no session
- `withAuth(promise)` — wraps SDK calls; on a 401 redirects to `/api/auth/logout`,
  which clears the cookie and lands on /login

> Cookies are **readonly while a Server Component renders** — Next only allows
> writes from a Server Action or Route Handler. That is why `withAuth()` hands off
> to `/api/auth/logout` instead of calling `session.destroy()` inline. Calling it
> during render throws `ReadonlyRequestCookiesError` and drops the user on the
> error boundary. Never wrap `withAuth()` in a `try/catch` that swallows errors
> either: the redirect works by throwing, so catching it silently cancels it.
- Always pass `limit` to BI methods (20-50 for tables, 100 for selectors)

## Important: loading states

Dashboard pages fetch data from the Sesame BI engine (server-side). Without a `loading.tsx`, navigation between sections will appear frozen while data loads. The template includes `src/app/dashboard/loading.tsx` — keep it or add your own loading UI. Every dashboard subdirectory with async data should have one.

## Session details

- **Storage**: encrypted httpOnly cookie via `iron-session`
- **TTL**: 1 week
- **Contents**: token, region, companyId, employeeId, employeeName, and `embedded` (true for Cowork-launched sessions)
- **Security**: cookies are encrypted with `SESSION_SECRET`, httpOnly (no JS access), secure in production
- **Cookie name**: defaults to `sesame-session`, configurable via `SESSION_COOKIE_NAME`

## Deploying to production

1. Set `SESSION_SECRET` to a random 32+ character string (the app will refuse to start with the placeholder value):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. If using OAuth, set `OAUTH_REDIRECT_URI` to your production callback URL (e.g. `https://myapp.com/api/auth/callback`).
3. All environment variables are listed in `.env.example`.

## Push notifications

Send push notifications to the Sesame HR mobile app using the SDK:

```typescript
const sdk = await getSesame()
await sdk.notifications.sendPush({
  employeeId: 'target-employee-id',
  title: 'Notification title',
  message: 'Notification body',
  applicationId: process.env.SESAME_APPLICATION_ID!,
})
```

Set `SESAME_APPLICATION_ID` in your environment variables (see `.env.example`).

## Building with Claude Code

This project includes a [Claude Code](https://claude.com/claude-code) slash command that lets you generate features using the SDK. After cloning:

```bash
# In the project directory, run Claude Code and use the skill:
/sesame-app build a page that shows team status with online/offline summary and employee table
```

The `/sesame-app` command reads the SDK documentation, follows the project conventions (loading states, error boundaries, pagination, `withAuth()` pattern), and generates production-ready pages.

The skill is defined in `.claude/commands/sesame-app.md`.
