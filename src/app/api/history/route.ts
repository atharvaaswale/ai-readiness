import { listRecentAnalyses } from '@/lib/supabase/queries'

export async function GET() {
  const analyses = await listRecentAnalyses(20)
  return Response.json({ analyses, total: analyses.length })
}
