// ------------------------------------------------------------------
// HistoryList
//
// Purpose:
//   Lists past analyses. Supports navigating back to previous results
//   without re-submitting the URL.
//
// Responsibility:
//   - Fetches from GET /api/history on mount (client component)
//   - Renders a list/cards with URL (truncated), date, overall score,
//     and grade Badge
//   - Click navigates to /results/[id]
//   - Shows empty state when no analyses exist
//
// Dependencies:
//   - components/ui/card.tsx
//   - components/ui/badge.tsx
//   - types/api.ts (HistoryResponse)
// -----------------------------------------------------------------/

'use client'

export { /* HistoryList component */ }
