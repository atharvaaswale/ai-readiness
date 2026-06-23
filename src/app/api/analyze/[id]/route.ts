import { getAnalysisStatus } from '@/lib/supabase/queries'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const result = await getAnalysisStatus(id)
  if (!result) {
    return Response.json({ error: 'Analysis not found' }, { status: 404 })
  }

  return Response.json(result)
}
