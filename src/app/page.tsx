'use client'

import { useState, useEffect } from 'react'
import { AnalysisForm } from '@/components/analysis-form'
import { ResultsDashboard } from '@/components/results-dashboard'
import type { BasicAnalyzeResponse } from '@/types/api'

interface HistoryEntry {
  id: string
  url: string
  score: number
  grade: string
  date: string
}

type PageState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'results'; data: BasicAnalyzeResponse }
  | { phase: 'error'; message: string }

export default function HomePage() {
  const [state, setState] = useState<PageState>({ phase: 'idle' })
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('analysisHistory')
    if (stored) {
      try {
        setHistory(JSON.parse(stored))
      } catch { /* ignore */ }
    }
  }, [])

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

      if (data.analysisId) {
        const entry: HistoryEntry = {
          id: data.analysisId,
          url: data.url,
          score: data.overallScore,
          grade: data.overallGrade,
          date: new Date().toISOString(),
        }
        const updated = [entry, ...history.filter((h) => h.id !== entry.id)].slice(0, 10)
        setHistory(updated)
        localStorage.setItem('analysisHistory', JSON.stringify(updated))
      }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          AI Readiness Analyzer
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Enter a URL to analyze its AI-readiness, SEO, and structure.
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <AnalysisForm onAnalyze={handleAnalyze} loading={state.phase === 'loading'} />
      </div>

      {state.phase === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400 dark:text-gray-500">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400" />
          <span>Analyzing page&hellip;</span>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {state.message}
        </div>
      )}

      {state.phase === 'results' && (
        <div className="space-y-4">
          {state.data.analysisId && (
            <div className="text-right">
              <a
                href={`/results/${state.data.analysisId}`}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                View permanent results page &rarr;
              </a>
            </div>
          )}
          <ResultsDashboard results={state.data} />
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Recent Analyses
          </h2>
          <div className="space-y-2">
            {history.map((entry) => (
              <a
                key={entry.id}
                href={`/results/${entry.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <span className="truncate text-gray-700 dark:text-gray-300 max-w-md">
                  {entry.url}
                </span>
                <span className="ml-3 shrink-0 font-semibold text-gray-500 dark:text-gray-400">
                  {entry.grade} ({entry.score})
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
