// ------------------------------------------------------------------
// Landing Page (route: /)
//
// Purpose:
//   Root route. Manages the analysis lifecycle state machine:
//   idle → loading → results (or error).
//
// Responsibility:
//   - Renders AnalysisForm at the top
//   - Calls POST /api/analyze on form submit
//   - Displays loading indicator while analysis runs
//   - Shows ResultsDashboard on success
//   - Shows error message on failure
//
// Dependencies:
//   - components/analysis-form.tsx
//   - components/results-dashboard.tsx
//   - types/api.ts (BasicAnalyzeResponse)
// ------------------------------------------------------------------

'use client'

import { useState } from 'react'
import { AnalysisForm } from '@/components/analysis-form'
import { ResultsDashboard } from '@/components/results-dashboard'
import type { BasicAnalyzeResponse } from '@/types/api'

type PageState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'results'; data: BasicAnalyzeResponse }
  | { phase: 'error'; message: string }

export default function HomePage() {
  const [state, setState] = useState<PageState>({ phase: 'idle' })

  async function handleAnalyze(url: string) {
    setState({ phase: 'loading' })

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()

      if (!res.ok) {
        setState({ phase: 'error', message: data.error || 'Analysis failed' })
        return
      }

      setState({ phase: 'results', data })
    } catch {
      setState({
        phase: 'error',
        message: 'Network error. Please check your connection and try again.',
      })
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          AI Readiness Analyzer
        </h1>
        <p className="mt-2 text-gray-500">
          Enter a URL to analyze its AI-readiness, SEO, and structure.
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <AnalysisForm onAnalyze={handleAnalyze} loading={state.phase === 'loading'} />
      </div>

      {state.phase === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          <span>Analyzing page&hellip;</span>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {state.phase === 'results' && <ResultsDashboard results={state.data} />}
    </main>
  )
}
