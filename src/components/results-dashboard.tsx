// ------------------------------------------------------------------
// ResultsDashboard
//
// Purpose:
//   Displays the analysis results after a successful API response.
//
// Responsibility:
//   - Shows analyzed URL and overall score (0–100)
//   - Lists extracted data: title, h1 count, meta description
//   - Lists each finding with pass/fail status
//   - Color codes the score: green (≥80), yellow (≥60), red (<60)
//
// Dependencies:
//   - types/api.ts (BasicAnalyzeResponse)
// ------------------------------------------------------------------

'use client'

import type { BasicAnalyzeResponse } from '@/types/api'

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-50 border-green-200'
  if (score >= 60) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

interface ResultsDashboardProps {
  results: BasicAnalyzeResponse
}

export function ResultsDashboard({ results }: ResultsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Score hero */}
      <div
        className={`rounded-xl border-2 p-6 text-center ${scoreBg(results.overallScore)}`}
      >
        <p className="text-sm text-gray-500">Overall AI Readiness Score</p>
        <p className={`text-5xl font-bold ${scoreColor(results.overallScore)}`}>
          {results.overallScore}
        </p>
        <p className="mt-1 text-xs text-gray-400 break-all">{results.url}</p>
      </div>

      {/* Extracted data */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Extracted Page Data
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Title</dt>
            <dd className="font-medium text-gray-900 max-w-md text-right truncate">
              {results.title ?? <em className="text-gray-400">Not found</em>}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">H1 Count</dt>
            <dd className="font-medium text-gray-900">{results.h1Count}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Meta Description</dt>
            <dd className="font-medium text-gray-900 max-w-md text-right truncate">
              {results.metaDescription ?? (
                <em className="text-gray-400">Not found</em>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Findings */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Findings ({results.findings.filter((f) => f.passed).length}/
          {results.findings.length} passed)
        </h2>
        <ul className="space-y-2">
          {results.findings.map((finding, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 shrink-0">
                {finding.passed ? (
                  <span className="text-green-600">&#10003;</span>
                ) : (
                  <span className="text-red-600">&#10007;</span>
                )}
              </span>
              <span className="text-gray-700">{finding.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
