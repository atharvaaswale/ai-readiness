// ------------------------------------------------------------------
// GET /api/history
//
// Purpose:
//   Returns recent analyses. Called by the HistoryList component
//   (or the history page if added).
//
// Responsibility:
//   - Queries analyses ordered by created_at DESC, limited to 20
//   - Returns { analyses: [...], total: number }
//
// Dependencies:
//   - lib/supabase/server.ts
//   - lib/supabase/queries.ts (listRecentAnalyses)
//   - types/api.ts (HistoryResponse)
// -----------------------------------------------------------------/

export async function GET() {
  // 1. Query recent analyses
  // 2. Return paginated list
}
