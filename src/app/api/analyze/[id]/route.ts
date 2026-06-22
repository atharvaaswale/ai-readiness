// ------------------------------------------------------------------
// GET /api/analyze/[id]
//
// Purpose:
//   Lightweight polling endpoint. The results page calls this every
//   3 seconds until status changes to 'completed' or 'failed'.
//
// Responsibility:
//   - Reads analyses.status from Supabase
//   - Returns { status, overallScore? }
//
// Dependencies:
//   - lib/supabase/server.ts
//   - lib/supabase/queries.ts (getAnalysisStatus)
//   - types/api.ts (AnalyzeStatusResponse)
// -----------------------------------------------------------------/

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Extract id from params
  // 2. Query analyses table for status + score
  // 3. Return { status, overallScore }
}
