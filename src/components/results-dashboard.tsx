// ------------------------------------------------------------------
// ResultsDashboard
//
// Purpose:
//   Displays the analysis results after a successful API response.
//   Shows per-dimension scores and detailed findings across all
//   7 active analyzers.
//
// Responsibility:
//   - Shows overall score hero (0–100, color-coded)
//   - Per-dimension score badges (2 columns × 4 rows)
//   - Extracted page data summary
//   - Semantic HTML, structured data, robots, sitemap, image sections
//   - Flat findings list for backward compatibility
//
// Dependencies:
//   - types/api.ts (BasicAnalyzeResponse)
// ------------------------------------------------------------------

'use client'

import type { BasicAnalyzeResponse } from '@/types/api'

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
  if (score >= 60) return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
  return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
}

interface DimensionBadgeProps {
  label: string
  score: number
}

function DimensionBadge({ label, score }: DimensionBadgeProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700 dark:bg-gray-900">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-bold ${scoreColor(score)}`}>{score}</span>
    </div>
  )
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
        <p className="text-sm text-gray-500 dark:text-gray-400">Overall AI Readiness Score</p>
        <p className={`text-5xl font-bold ${scoreColor(results.overallScore)}`}>
          {results.overallScore}
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 break-all">{results.url}</p>
      </div>

      {/* Per-dimension scores */}
      <div className="grid grid-cols-2 gap-3">
        <DimensionBadge label="SEO" score={results.seoScore} />
        <DimensionBadge label="Heading Hierarchy" score={results.headingHierarchyScore} />
        <DimensionBadge label="Semantic HTML" score={results.semanticHtmlScore} />
        <DimensionBadge label="Structured Data" score={results.structuredDataScore} />
        <DimensionBadge label="Image Accessibility" score={results.imageAccessibilityScore} />
        <DimensionBadge label="Robots.txt" score={results.robotsScore} />
        <DimensionBadge label="Sitemap" score={results.sitemapScore} />
      </div>

      {/* Extracted data */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
          Extracted Page Data
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Title</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100 max-w-md text-right truncate">
              {results.title ?? <em className="text-gray-400 dark:text-gray-500">Not found</em>}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">H1 / H2 / H3</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">
              {results.h1Count} / {results.h2Count} / {results.h3Count}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Meta Description</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100 max-w-md text-right truncate">
              {results.metaDescription ?? (
                <em className="text-gray-400 dark:text-gray-500">Not found</em>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* AI Recommendations / Gemini */}
      {results.geminiOutput && (
        <>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950">
            <h2 className="mb-3 text-sm font-semibold text-indigo-700 uppercase tracking-wide dark:text-indigo-300">
              AI Recommendations
            </h2>
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">{results.geminiOutput.summary}</p>
            {results.geminiOutput.topPriorities.length > 0 && (
              <div className="mb-4">
                <p className="mb-1 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">Top Priorities</p>
                <ul className="space-y-1">
                  {results.geminiOutput.topPriorities.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                      <span className="mt-0.5 shrink-0 text-indigo-500 dark:text-indigo-400">&rarr;</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="space-y-2">
              {results.geminiOutput.recommendations.map((rec, i) => {
                const priorityColors: Record<string, string> = {
                  critical: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
                  high: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700',
                  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
                  low: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
                }
                return (
                  <div
                    key={i}
                    className="rounded border bg-white p-3 dark:border-gray-600 dark:bg-gray-800"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-xs font-medium capitalize ${
                          priorityColors[rec.priority] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {rec.priority}
                      </span>
                      <span className="text-xs text-gray-400 capitalize dark:text-gray-500">{rec.dimension}</span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{rec.action}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{rec.impact}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Semantic HTML */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
          Semantic HTML Elements
        </h2>
        <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">
          {results.semanticElements.detected.length} detected,{' '}
          {results.semanticElements.missing.length} missing
        </p>
        <div className="flex flex-wrap gap-2">
          {results.semanticElements.detected.map((el) => (
            <span key={el} className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
              &lt;{el}&gt;
            </span>
          ))}
          {results.semanticElements.missing.map((el) => (
            <span key={el} className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-500 line-through dark:bg-red-900 dark:text-red-300">
              &lt;{el}&gt;
            </span>
          ))}
        </div>
      </div>

      {/* Structured Data */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
          Structured Data
        </h2>
        {results.detectedSchemas.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {results.detectedSchemas.map((schema) => (
              <span key={schema} className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {schema}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">No recognized schema types detected</p>
        )}
      </div>

      {/* Image Accessibility */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
          Image Accessibility
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Total Images</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{results.imageData.totalImages}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">With Alt Text</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{results.imageData.imagesWithAlt}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Missing Alt Text</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{results.imageData.imagesWithoutAlt}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Coverage</dt>
            <dd className={`font-medium ${scoreColor(results.imageAccessibilityScore)}`}>
              {results.imageData.coveragePercent}%
            </dd>
          </div>
        </dl>
      </div>

      {/* Robots.txt */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
          Robots.txt
        </h2>
        {results.robotsData.exists ? (
          <div className="space-y-2 text-sm">
            <p className="text-green-700 dark:text-green-400">Robots.txt found</p>
            {results.robotsData.userAgents.length > 0 && (
              <p className="text-gray-600 dark:text-gray-400">
                User-agent directives: {results.robotsData.userAgents.join(', ')}
              </p>
            )}
            {results.robotsData.sitemapUrls.length > 0 && (
              <p className="text-gray-600 dark:text-gray-400">
                Sitemap references: {results.robotsData.sitemapUrls.length}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">No robots.txt found</p>
        )}
      </div>

      {/* Sitemap */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
          Sitemap
        </h2>
        {results.sitemapData.exists ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Status</dt>
              <dd className="font-medium text-green-700 dark:text-green-400">Found</dd>
            </div>
            {results.sitemapData.urlCount !== null && (
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Estimated URLs</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{results.sitemapData.urlCount}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">No XML sitemap found</p>
        )}
      </div>

      {/* Findings */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">
          Detailed Findings ({results.findings.filter((f) => f.passed).length}/
          {results.findings.length} passed)
        </h2>
        <ul className="space-y-2">
          {results.findings.map((finding, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 shrink-0">
                {finding.passed ? (
                  <span className="text-green-600 dark:text-green-400">&#10003;</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">&#10007;</span>
                )}
              </span>
              <span className="text-gray-700 dark:text-gray-300">{finding.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
