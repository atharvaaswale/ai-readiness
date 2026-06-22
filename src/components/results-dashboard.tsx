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
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-50 border-green-200'
  if (score >= 60) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

interface DimensionBadgeProps {
  label: string
  score: number
}

function DimensionBadge({ label, score }: DimensionBadgeProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
      <span className="text-sm text-gray-600">{label}</span>
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
        <p className="text-sm text-gray-500">Overall AI Readiness Score</p>
        <p className={`text-5xl font-bold ${scoreColor(results.overallScore)}`}>
          {results.overallScore}
        </p>
        <p className="mt-1 text-xs text-gray-400 break-all">{results.url}</p>
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
            <dt className="text-gray-500">H1 / H2 / H3</dt>
            <dd className="font-medium text-gray-900">
              {results.h1Count} / {results.h2Count} / {results.h3Count}
            </dd>
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

      {/* Semantic HTML */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Semantic HTML Elements
        </h2>
        <p className="mb-2 text-xs text-gray-400">
          {results.semanticElements.detected.length} detected,{' '}
          {results.semanticElements.missing.length} missing
        </p>
        <div className="flex flex-wrap gap-2">
          {results.semanticElements.detected.map((el) => (
            <span key={el} className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              &lt;{el}&gt;
            </span>
          ))}
          {results.semanticElements.missing.map((el) => (
            <span key={el} className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-500 line-through">
              &lt;{el}&gt;
            </span>
          ))}
        </div>
      </div>

      {/* Structured Data */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Structured Data
        </h2>
        {results.detectedSchemas.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {results.detectedSchemas.map((schema) => (
              <span key={schema} className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {schema}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No recognized schema types detected</p>
        )}
      </div>

      {/* Image Accessibility */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Image Accessibility
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Total Images</dt>
            <dd className="font-medium text-gray-900">{results.imageData.totalImages}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">With Alt Text</dt>
            <dd className="font-medium text-gray-900">{results.imageData.imagesWithAlt}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Missing Alt Text</dt>
            <dd className="font-medium text-gray-900">{results.imageData.imagesWithoutAlt}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Coverage</dt>
            <dd className={`font-medium ${scoreColor(results.imageAccessibilityScore)}`}>
              {results.imageData.coveragePercent}%
            </dd>
          </div>
        </dl>
      </div>

      {/* Robots.txt */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Robots.txt
        </h2>
        {results.robotsData.exists ? (
          <div className="space-y-2 text-sm">
            <p className="text-green-700">Robots.txt found</p>
            {results.robotsData.userAgents.length > 0 && (
              <p className="text-gray-600">
                User-agent directives: {results.robotsData.userAgents.join(', ')}
              </p>
            )}
            {results.robotsData.sitemapUrls.length > 0 && (
              <p className="text-gray-600">
                Sitemap references: {results.robotsData.sitemapUrls.length}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No robots.txt found</p>
        )}
      </div>

      {/* Sitemap */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Sitemap
        </h2>
        {results.sitemapData.exists ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Status</dt>
              <dd className="font-medium text-green-700">Found</dd>
            </div>
            {results.sitemapData.urlCount !== null && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Estimated URLs</dt>
                <dd className="font-medium text-gray-900">{results.sitemapData.urlCount}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-sm text-gray-400">No XML sitemap found</p>
        )}
      </div>

      {/* Findings */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Detailed Findings ({results.findings.filter((f) => f.passed).length}/
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
