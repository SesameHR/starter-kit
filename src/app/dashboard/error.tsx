'use client'

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h1>Something went wrong</h1>
      <p>There was a problem loading this page. Please try again.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </div>
  )
}
