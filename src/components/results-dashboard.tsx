'use client'

import { useState, useRef } from 'react'
import type { BasicAnalyzeResponse } from '@/types/api'
import type { Grade, Severity } from '@/types/report'
import { OptimizationChat } from './optimization-chat'

function gradeColor(grade: Grade): string {
  if (grade === 'A+' || grade === 'A') return 'text-green-600 dark:text-green-400'
  if (grade === 'B+' || grade === 'B') return 'text-blue-600 dark:text-blue-400'
  if (grade === 'C') return 'text-yellow-600 dark:text-yellow-400'
  if (grade === 'D') return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

function gradeBg(grade: Grade): string {
  if (grade === 'A+' || grade === 'A') return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
  if (grade === 'B+' || grade === 'B') return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
  if (grade === 'C') return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
  if (grade === 'D') return 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
  return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
}

function severityColor(severity: Severity): string {
  const map: Record<Severity, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
    high: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
    low: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
  }
  return map[severity]
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

interface ResultsDashboardProps {
  results: BasicAnalyzeResponse
}

export function ResultsDashboard({ results }: ResultsDashboardProps) {
  const [chatOpen, setChatOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  return (
    <div className="space-y-8">
      {/* Chat toggle - visible on all screens */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Open chat"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Chat panel - single responsive element */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setChatOpen(false)}>
          <div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 lg:right-4 lg:left-auto lg:top-24 lg:bottom-24 w-full lg:w-[22rem] flex flex-col max-h-[85vh] lg:max-h-none rounded-t-2xl lg:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-xl"
          >
            <OptimizationChat results={results} onClose={() => setChatOpen(false)} isModal />
          </div>
        </div>
      )}

      {/* Report Header */}
      <div className={`rounded-2xl border-2 p-8 text-center ${gradeBg(results.overallGrade)}`}>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          AI Readiness Report
        </p>
        <p className={`mt-1 text-7xl font-black ${gradeColor(results.overallGrade)}`}>
          {results.overallGrade}
        </p>
        <p className={`mt-2 text-3xl font-bold ${scoreColor(results.overallScore)}`}>
          {results.overallScore}/100
        </p>
        <p className="mt-3 text-sm text-gray-400 dark:text-gray-500 break-all">
          {results.url}
        </p>
      </div>

      {/* Executive Summary */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Executive Summary
        </h2>
        <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed">
          {results.executiveSummary.summary}
        </p>
        {(results.executiveSummary.strengths.length > 0 || results.executiveSummary.weaknesses.length > 0) && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {results.executiveSummary.strengths.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                  Strengths
                </p>
                <ul className="space-y-1">
                  {results.executiveSummary.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="mt-0.5 shrink-0 text-green-500">✔</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {results.executiveSummary.weaknesses.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                  Weaknesses
                </p>
                <ul className="space-y-1">
                  {results.executiveSummary.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="mt-0.5 shrink-0 text-red-500">✖</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Category Breakdown
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {results.categories.map((cat) => (
            <div
              key={cat.id}
              className={`rounded-xl border-2 p-5 ${gradeBg(cat.grade)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {cat.label}
                  </p>
                  <p className={`mt-1 text-3xl font-black ${gradeColor(cat.grade)}`}>
                    {cat.grade}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${scoreColor(cat.score)}`}>
                    {cat.score}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {cat.passedCount}/{cat.findingsCount} passed
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-dimension scores */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Dimension Scores
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'SEO', score: results.seoScore },
            { label: 'Heading Hierarchy', score: results.headingHierarchyScore },
            { label: 'Semantic HTML', score: results.semanticHtmlScore },
            { label: 'Structured Data', score: results.structuredDataScore },
            { label: 'Image Accessibility', score: results.imageAccessibilityScore },
            { label: 'Performance', score: results.performanceScore },
            { label: 'Robots.txt', score: results.robotsScore },
            { label: 'Sitemap', score: results.sitemapScore },
            { label: 'AEO', score: results.aeoScore },
          ].map((d) => (
            <div
              key={d.label}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700 dark:bg-gray-900"
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">{d.label}</span>
              {d.score !== null ? (
              <span className={`text-sm font-bold ${scoreColor(d.score)}`}>{d.score}</span>
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
            )}
            </div>
          ))}
        </div>
      </div>

      {/* Performance */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          PageSpeed Performance
        </h2>
        {results.pageSpeedData.performanceScore !== null ? (
          <>
            <div className="mt-3 flex items-center gap-3">
              <span className={`text-2xl font-black ${scoreColor(results.performanceScore)}`}>
                {results.performanceScore}/100
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Performance Score</span>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {results.pageSpeedData.fcp && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">FCP</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{results.pageSpeedData.fcp.display}</dd>
                </div>
              )}
              {results.pageSpeedData.lcp && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">LCP</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{results.pageSpeedData.lcp.display}</dd>
                </div>
              )}
              {results.pageSpeedData.cls && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">CLS</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{results.pageSpeedData.cls.display}</dd>
                </div>
              )}
              {results.pageSpeedData.inp && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">INP</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{results.pageSpeedData.inp.display}</dd>
                </div>
              )}
              {results.pageSpeedData.tbt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">TBT</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{results.pageSpeedData.tbt.display}</dd>
                </div>
              )}
              {results.pageSpeedData.speedIndex && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Speed Index</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">{results.pageSpeedData.speedIndex.display}</dd>
                </div>
              )}
            </dl>
          </>
        ) : (
          <div>
            <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">
              PageSpeed Insights data could not be fetched
            </p>
            {results.pageSpeedData.debug && (
              <p className="mt-2 text-xs text-red-400 dark:text-red-500 break-all">
                {results.pageSpeedData.debug}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Prioritized Actions */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Prioritized Actions
        </h2>
        {results.prioritizedActions.length === 0 ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              No issues found &mdash; all checks passed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.prioritizedActions.map((action, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`rounded border px-2 py-0.5 text-xs font-semibold capitalize ${severityColor(action.severity)}`}>
                    {action.severity}
                  </span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {action.impactArea}
                  </span>
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                    Impact: {action.impactScore}/100
                  </span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {action.finding.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendations (Gemini, non-scoring) */}
      {results.geminiOutput && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-800 dark:bg-indigo-950">
          <h2 className="mb-1 text-xs font-semibold text-indigo-500 dark:text-indigo-300 uppercase tracking-widest">
            AI-Generated Insights
          </h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {results.geminiOutput.summary}
          </p>
          {results.geminiOutput.recommendations.length > 0 && (
            <div className="mt-4 space-y-2">
              {results.geminiOutput.recommendations.map((rec, i) => {
                const colors: Record<string, string> = {
                  critical: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
                  high: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700',
                  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
                  low: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
                }
                return (
                  <div key={i} className="rounded-lg border bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`rounded border px-1.5 py-0.5 text-xs font-medium capitalize ${colors[rec.priority] ?? ''}`}>
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
          )}
        </div>
      )}

      {/* AEO (Answer Engine Optimization) */}
      {results.aeoAnalysis ? (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950">
          <h2 className="mb-1 text-xs font-semibold text-purple-500 dark:text-purple-300 uppercase tracking-widest">
            Answer Engine Optimization (AEO)
          </h2>

          {/* AEO Score */}
          <div className="mt-4 flex items-center gap-4">
            <span className={`text-4xl font-black ${scoreColor(results.aeoScore ?? 0)}`}>
              {results.aeoScore}/100
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">AEO Score (Gemini-evaluated)</span>
          </div>

          {/* Dimension Breakdown */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Clarity', score: results.aeoAnalysis.clarity },
              { label: 'Authority', score: results.aeoAnalysis.authority },
              { label: 'Answerability', score: results.aeoAnalysis.answerability },
              { label: 'Entity Recognition', score: results.aeoAnalysis.entityRecognition },
              { label: 'Citation Readiness', score: results.aeoAnalysis.citationReadiness },
            ].map((d) => (
              <div
                key={d.label}
                className="flex items-center justify-between rounded-lg border border-purple-200 bg-white p-3 dark:border-purple-700 dark:bg-purple-900"
              >
                <span className="text-xs text-gray-600 dark:text-gray-400">{d.label}</span>
                <span className={`text-sm font-bold ${scoreColor(d.score)}`}>{d.score}</span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {results.aeoAnalysis.summary}
          </p>

          {/* Recommendations */}
          {results.aeoAnalysis.recommendations.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Recommendations
              </p>
              {results.aeoAnalysis.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-purple-200 bg-white p-3 dark:border-purple-700 dark:bg-purple-900"
                >
                  <span className="mt-0.5 shrink-0 text-purple-500 text-sm font-bold">{i + 1}.</span>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{rec}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Answer Engine Optimization (AEO)
          </h2>
          <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">
            AEO analysis is currently unavailable. This feature requires the Gemini API.
          </p>
        </div>
      )}

      {/* llms.txt status */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          llms.txt Status
        </h2>
        {results.aeoData.llmsTxt.exists ? (
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Status</dt>
              <dd className="font-medium text-green-700 dark:text-green-400">Found</dd>
            </div>
            {results.aeoData.llmsTxt.contentLength !== null && (
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Content Length</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {results.aeoData.llmsTxt.contentLength} bytes
                </dd>
              </div>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              /llms.txt helps LLM crawlers discover and cite your content more effectively.
            </p>
          </dl>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-gray-400 dark:text-gray-500">No /llms.txt found</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Adding an llms.txt file helps LLM-based answer engines discover your content.
            </p>
          </div>
        )}
      </div>

      {/* Extracted data */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Extracted Page Data
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">Title</dt>
            <dd className="max-w-md text-right">
              {results.title != null ? (
                <input
                  readOnly
                  type="text"
                  value={results.title}
                  className="font-medium text-gray-900 dark:text-gray-100 w-full bg-transparent border-0 p-0 focus:ring-0 cursor-default"
                />
              ) : (
                <em className="text-gray-400 dark:text-gray-500">Not found</em>
              )}
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
            <dd className="max-w-md text-right">
              {results.metaDescription != null ? (
                <input
                  readOnly
                  type="text"
                  value={results.metaDescription}
                  className="font-medium text-gray-900 dark:text-gray-100 w-full bg-transparent border-0 p-0 focus:ring-0 cursor-default"
                />
              ) : (
                <em className="text-gray-400 dark:text-gray-500">Not found</em>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Semantic HTML */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Semantic HTML Elements
        </h2>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          {results.semanticElements.detected.length} detected,{' '}
          {results.semanticElements.missing.length} missing
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
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
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Structured Data
        </h2>
        {results.detectedSchemas.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {results.detectedSchemas.map((schema) => (
              <span key={schema} className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {schema}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">No recognized schema types detected</p>
        )}
      </div>

      {/* Image Accessibility */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Image Accessibility
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
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
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Robots.txt
        </h2>
        {results.robotsData.exists ? (
          <div className="mt-3 space-y-2 text-sm">
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
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">No robots.txt found</p>
        )}
      </div>

      {/* Sitemap */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Sitemap
        </h2>
        {results.sitemapData.exists ? (
          <dl className="mt-3 space-y-2 text-sm">
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
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">No XML sitemap found</p>
        )}
      </div>

      {/* Findings */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Detailed Findings
        </h2>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          {results.findings.filter((f) => f.passed).length}/{results.findings.length} passed
        </p>
        <ul className="mt-3 space-y-2">
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
