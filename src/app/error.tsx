// ------------------------------------------------------------------
// Global Error Boundary (route: /)
//
// Purpose:
//   Catches unhandled errors in any page rendered within the root
//   layout.
//
// Responsibility:
//   - Displays a friendly error message with retry action
//   - Logs the error for debugging
//
// Dependencies:
//   - components/ui/button.tsx
// ------------------------------------------------------------------

'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <div>{/* Error UI */}</div>
}
