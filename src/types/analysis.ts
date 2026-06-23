// ------------------------------------------------------------------
// Analysis Types
//
// Purpose:
//   Central type definitions for all analysis-related data structures
//   used across the application.
//
// Responsibility:
//   Defines the core domain types that every other module imports:
//   - Dimension (union of 6 strings)
//   - AnalysisStatus ('pending' | 'running' | 'completed' | 'failed')
//   - Analysis (database row shape)
//   - PageData (extracted HTML metadata)
//   - CoreWebVitals (PageSpeed results)
//   - AiAnalysis (Gemini results)
//   - Finding (single pass/fail check)
//   - Recommendation (AI-suggested action)
//   - SeoResult, StructureResult, AccessibilityResult,
//     DiscoverabilityResult (analyzer outputs)
// -----------------------------------------------------------------/

export type Dimension =
  | 'ai-readiness'
  | 'seo'
  | 'structure'
  | 'accessibility'
  | 'performance'
  | 'discoverability'

export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface Analysis {
  id: string
  url: string
  status: AnalysisStatus
  errorMessage: string | null
  aiReadinessScore: number | null
  seoScore: number | null
  structureScore: number | null
  accessibilityScore: number | null
  performanceScore: number | null
  discoverabilityScore: number | null
  overallScore: number | null
  createdAt: string
  completedAt: string | null
}

export interface PageData {
  id: string
  analysisId: string
  title: string | null
  metaDescription: string | null
  canonicalUrl: string | null
  robotsDirectives: string | null
  ogData: Record<string, string> | null
  twitterData: Record<string, string> | null
  structuredData: unknown[] | null
  headings: Record<string, string[]> | null
  semanticElements: Record<string, number> | null
  accessibility: Record<string, unknown> | null
  techIndicators: Record<string, unknown> | null
  htmlSizeBytes: number | null
  fetchedAt: string
}

export interface CoreWebVitals {
  id: string
  analysisId: string
  lcp: number | null
  fid: number | null
  inp: number | null
  cls: number | null
  performanceScore: number | null
  rawResponse: unknown | null
}

export interface AiAnalysis {
  id: string
  analysisId: string
  geminiModel: string
  promptTokens: number | null
  summary: string | null
  recommendations: Recommendation[] | null
  strengths: string[] | null
  weaknesses: string[] | null
  rawResponse: unknown | null
}

export interface Finding {
  category: string
  passed: boolean
  description: string
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  dimension: Dimension
  description: string
}

// Shared interface all analyzers produce
export interface AnalyzerResult {
  score: number
  findings: Finding[]
}

export interface SeoResult extends AnalyzerResult {
  title: string | null
  metaDescription: string | null
}

export interface HeadingHierarchyResult extends AnalyzerResult {
  h1Count: number
  h2Count: number
  h3Count: number
}

export interface SemanticHtmlResult extends AnalyzerResult {
  detected: string[]
  missing: string[]
}

export interface StructuredDataResult extends AnalyzerResult {
  detectedSchemas: string[]
}

export interface RobotsResult extends AnalyzerResult {
  exists: boolean
  content: string | null
  userAgents: string[]
  sitemapUrls: string[]
}

export interface SitemapResult extends AnalyzerResult {
  exists: boolean
  urlCount: number | null
}

export interface ImageAccessibilityResult extends AnalyzerResult {
  totalImages: number
  imagesWithAlt: number
  imagesWithoutAlt: number
  coveragePercent: number
}

export interface StructureResult {
  score: number
  findings: Finding[]
}

export interface AccessibilityResult {
  score: number
  findings: Finding[]
}

export interface DiscoverabilityResult {
  score: number
  findings: Finding[]
}

export interface PageSpeedMetric {
  value: number
  display: string
}

export interface PerformanceResult extends AnalyzerResult {
  pageSpeedData: {
    performanceScore: number | null
    fcp: PageSpeedMetric | null
    lcp: PageSpeedMetric | null
    cls: PageSpeedMetric | null
    inp: PageSpeedMetric | null
    tbt: PageSpeedMetric | null
    speedIndex: PageSpeedMetric | null
    debug?: string
  }
}
