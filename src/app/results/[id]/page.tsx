import { getAnalysisById } from '@/lib/supabase/queries'
import { ResultsDashboard } from '@/components/results-dashboard'
import { notFound } from 'next/navigation'
import type { BasicAnalyzeResponse } from '@/types/api'

type AnalysisRow = Record<string, unknown>

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const analysis = (await getAnalysisById(id)) as AnalysisRow | null

  if (!analysis) notFound()

  const raw = analysis.raw_response as BasicAnalyzeResponse | null
  const errorMessage = analysis.error_message as string | null

  if (analysis.status === 'failed') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <p className="text-lg font-semibold">Analysis Failed</p>
          <p className="mt-2">{errorMessage ?? 'An unknown error occurred.'}</p>
        </div>
      </main>
    )
  }

  if (!raw || analysis.status !== 'completed') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">No results data available.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <ResultsDashboard results={raw} />
    </main>
  )
}
