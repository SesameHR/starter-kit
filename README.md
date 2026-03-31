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

## Multi-company support

If a user belongs to multiple companies, they'll see an account selector after login. The selected employee/company is stored in the encrypted session cookie.

## Project structure

```
src/
├── lib/
│   ├── session.ts          # iron-session config + getSession()
│   ├── sesame.ts           # getSesame() → authenticated SDK from session
│   └── oauth.ts            # SesameSSO client (only if OAuth vars are set)
├── middleware.ts            # Protects /dashboard/* + validates SESSION_SECRET in prod
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
        └── auto-login/route.ts # GET: handle auto-login token exchange
```

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
- `withAuth(promise)` — wraps SDK calls, redirects to /login if token expired (401/403)
- Always pass `limit` to BI methods (20-50 for tables, 100 for selectors)

## Important: loading states

Dashboard pages fetch data from the Sesame BI engine (server-side). Without a `loading.tsx`, navigation between sections will appear frozen while data loads. The template includes `src/app/dashboard/loading.tsx` — keep it or add your own loading UI. Every dashboard subdirectory with async data should have one.

## Session details

- **Storage**: encrypted httpOnly cookie via `iron-session`
- **TTL**: 1 week
- **Contents**: token, region, companyId, employeeId, employeeName
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

## SDK not published yet?

If `@sesamehr/sdk` isn't on npm yet, install from a local path:

```bash
npm install ../sesame-sdk
```
