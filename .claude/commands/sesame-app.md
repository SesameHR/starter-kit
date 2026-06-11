Build features for this Sesame HR app. Arguments: $ARGUMENTS

## Step 1: Read the documentation

Read these files before writing any code:

1. SDK reference: `node_modules/@sesamehr/sdk/README.md`

This project is based on the Sesame starter kit. It already includes: login (email + password with Sesame TOTP 2FA, OAuth SSO, auto-login), encrypted sessions (iron-session), route protection (middleware), logout, multi-company support, i18n with next-intl (en/es, cookie-based — no locale routing), and push notifications via the SDK.

## Step 2: Build what the user asks for

Interpret $ARGUMENTS and build the requested pages/sections.

### Mandatory rules

**SDK:**
- Use `getSesame()` from `@/lib/sesame` to get the authenticated SDK in Server Components
- Use `getSesameWithSession()` when you also need the employee name
- Wrap SDK calls with `withAuth()` from `@/lib/sesame` to handle expired tokens (auto-redirects to /login on 401/403)
- For mutations (clock in, clock out, approve, etc.) use Server Actions with `revalidatePath`
- `employees.me()` returns an object with `workStatus` ("online" | "offline" | "paused" | "remote"), `status`, `lastCheck`, etc.

**Example Server Component pattern:**
```typescript
import { getSesame, withAuth } from '@/lib/sesame'

export default async function MyPage() {
  const sdk = await getSesame()
  const [employees, summary] = await Promise.all([
    withAuth(sdk.employees.list({ limit: 20, offset: 0 })),
    withAuth(sdk.team.statusSummary()),
  ])
  // ...
}
```

**Pagination — ALWAYS paginate, NEVER omit limit:**
- BI methods: pass `limit` and `offset` (e.g. `{ limit: 20, offset: 0 }`)
- REST paginated methods (`Paginated<T>`): pass `limit` and `page` (1-indexed)
- NEVER call a BI method without `limit` — without it, the SDK defaults to 250 rows which is too many for a UI
- Use limit: 20-50 for tables, limit: 100 for dropdowns/selectors

**Translations (i18n) — ALWAYS:**
- NEVER hardcode user-facing strings — every label, title, message, and error goes through next-intl
- Add new strings to BOTH `messages/en.json` and `messages/es.json`, under one namespace per feature (e.g. `"team": { ... }`)
- Client Components: `const t = useTranslations('team')` from `next-intl`
- Server Components and Server Actions: `const t = await getTranslations('team')` from `next-intl/server`
- Interpolation: `"greeting": "Hi, {name}"` → `t('greeting', { name })`
- The active locale comes from the `NEXT_LOCALE` cookie (set by `src/components/LocaleSwitcher.tsx`) with Accept-Language fallback — do NOT add locale segments to routes

**Loading states — ALWAYS:**
- Every `/dashboard` subdirectory with an async `page.tsx` MUST have a `loading.tsx`
- The starter kit already includes `src/app/dashboard/loading.tsx` as an example

**Error boundaries — ALWAYS:**
- Every `/dashboard` subdirectory with an async `page.tsx` MUST have an `error.tsx`
- `error.tsx` must be a Client Component (`'use client'`) with a `reset` button
- The starter kit already includes `src/app/dashboard/error.tsx` as an example

**Navigation:**
- Add navigation between sections in the dashboard layout
- Use `next/link` with `usePathname()` to highlight the active section
- The nav component must be a Client Component (`'use client'`)

**Styling:**
- Tailwind CSS (already included)
- Clean and minimal design
- Cards for summaries, tables for lists
- Status dots with colors: online=green, remote=blue, paused=yellow, offline=gray

## Step 3: Verify

```bash
npx next build
```

The build must compile with zero errors. Fix any type errors.

## SDK quick reference

```typescript
const sdk = await getSesame()

// Employees (BI)
sdk.employees.list({ limit: 20, offset: 0 })        // → Employee[]
sdk.employees.working({ limit: 50 })                 // → Employee[] (online/remote)
sdk.employees.onBreak()                              // → Employee[]
sdk.employees.remote()                               // → Employee[]
sdk.employees.offline()                              // → Employee[]
sdk.employees.search('john')                         // → Employee[]
sdk.employees.byDepartment()                         // → GroupCount[]
sdk.employees.byOffice()                             // → GroupCount[]
sdk.employees.count()                                // → GroupCount[]
sdk.employees.me()                                   // → { workStatus, status, ... } (REST)

// Checks (BI reads + REST writes)
sdk.checks.history({ from, to, limit: 50 })          // → CheckEntry[]
sdk.checks.today({ limit: 50 })                      // → CheckEntry[]
sdk.checks.thisWeek({ limit: 100 })                  // → CheckEntry[]
sdk.checks.hoursByEmployee({ from, to })             // → CheckAggregation[]
sdk.checks.hoursByDepartment({ from, to })           // → CheckAggregation[]
sdk.checks.openChecks()                              // → CheckEntry[]
sdk.checks.myRequests()                              // → CheckRequestEntry[]
sdk.checks.clockIn()                                 // → clock in (REST)
sdk.checks.clockOut()                                // → clock out (REST)
sdk.checks.pause(breakId)                            // → start break (REST)
sdk.checks.breaks()                                  // → WorkBreak[] (REST)

// Vacations (BI reads + REST writes)
sdk.vacations.calendars({ year: 2026, limit: 100 })  // → VacationCalendar[]
sdk.vacations.balanceByEmployee({ limit: 100 })      // → VacationCalendar[]
sdk.vacations.history({ from, to, limit: 50 })       // → DayOff[]
sdk.vacations.pendingRequests({ limit: 50 })         // → DayOffRequest[]
sdk.vacations.byType({ from, to })                   // → GroupCount[]
sdk.vacations.request({ calendarId, dates })         // → submit vacation (REST)
sdk.vacations.cancel(requestId)                      // → cancel request (REST)

// Work Stats (REST)
sdk.workStats.summary({ from, to })                  // → WorkStatsResult

// Contracts (BI)
sdk.contracts.list({ limit: 50 })                    // → Contract[]
sdk.contracts.active({ limit: 50 })                  // → Contract[]
sdk.contracts.expiringSoon(90)                        // → Contract[]
sdk.contracts.byType()                               // → GroupCount[]
sdk.contracts.statusSummary()                        // → GroupCount[]

// Team admin (BI reads + REST writes)
sdk.team.status({ limit: 100 })                      // → TeamMember[]
sdk.team.working()                                   // → TeamMember[]
sdk.team.statusSummary()                             // → GroupCount[]
sdk.team.employeeChecks('name', { from, to })        // → TeamCheck[]
sdk.team.checkRequests()                             // → TeamRequestEntry[]
sdk.team.vacationRequests()                          // → TeamRequestEntry[]
sdk.team.approveCheckRequest(requestId)              // → approve (REST)
sdk.team.rejectCheckRequest(requestId)               // → reject (REST)
sdk.team.approveVacation(requestId)                  // → approve (REST)
sdk.team.rejectVacation(requestId)                   // → reject (REST)

// Notifications (REST)
sdk.notifications.sendPush({ employeeId, title, message, applicationId }) // → boolean

// Reports (raw BI)
import { BI_TABLES, BI_TEMPORAL } from '@sesamehr/sdk'
sdk.reports.query({ from: BI_TABLES.employees, select: [...], where: [...], limit: 20 })

// Auto-login (static — no SDK instance needed)
import { SesameSDK } from '@sesamehr/sdk'
SesameSDK.autoLoginWithDetails({ token, region: 'back-eu1' }) // → { sdk, details: AutoLoginResult }
```

### Response types

```typescript
Employee:        { name, firstName, lastName, email, status, workStatus, department?, office?, jobCharge? }
GroupCount:       { group, count }
CheckEntry:      { date, checkIn?, checkOut?, secondsWorked, isRemote, type, employeeName?, department? }
CheckAggregation:{ group, totalSeconds, count }
VacationCalendar:{ year, maxDaysOff, remainingDaysOff, calendarType, employeeName? }
DayOff:          { date, name, seconds?, employeeName?, absenceType? }
DayOffRequest:   { status, type, comment?, createdAt?, employeeName? }
Contract:        { status, startDate, endDate?, weeklyHours, fte, contractType?, employeeName? }
WorkStatsResult: { secondsWorked, secondsToWork, balance, workedDays, daysToWork, checksCount, ... }
WorkBreak:       { id, name, breakMinutes, remunerated, active }
```
