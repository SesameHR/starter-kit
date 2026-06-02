export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2.5">
      <svg className="size-4 shrink-0 animate-spin text-brand" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="text-sm font-medium text-foreground">Loading…</span>
    </div>
  )
}
