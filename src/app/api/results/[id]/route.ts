import { getAnalysisById } from '@/lib/supabase/queries'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const analysis = await getAnalysisById(id)
  if (!analysis) {
    return Response.json({ error: 'Analysis not found' }, { status: 404 })
  }

  const raw = analysis.raw_response as Record<string, unknown> | null

  return Response.json({
    id: analysis.id,
    url: analysis.url,
    status: analysis.status,
    overallScore: analysis.overall_score,
    overallGrade: raw?.overallGrade ?? null,
    completedAt: analysis.completed_at,
    rawResponse: raw,
  })
}
