// ------------------------------------------------------------------
// Results Error Boundary (route: /results/[id])
//
// Purpose:
//   Catches fetch errors or missing-analysis errors for the results
//   route only, without crashing the whole app.
//
// Responsibility:
//   Shows "Analysis not found" or network-error messages with a retry
//   button.
//
// Dependencies:
//   - components/ui/button.tsx
// ------------------------------------------------------------------

'use client'

export default function ResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <div>{/* Error with retry */}</div>
}
