// ------------------------------------------------------------------
// API Request/Response Types
//
// Purpose:
//   Every API endpoint has a typed contract. These types enforce
//   consistency between route handlers and client fetch calls.
//
// Responsibility:
//   Defines request and response shapes for all four endpoints:
//   - AnalyzeRequest        (POST /api/analyze body)
//   - AnalyzeResponse       (POST /api/analyze response)
//   - AnalyzeStatusResponse (GET /api/analyze/[id] response)
//   - FullResultsResponse   (GET /api/results/[id] response)
//   - HistoryResponse        (GET /api/history response)
// -----------------------------------------------------------------/

import type { Analysis, PageData, CoreWebVitals, AiAnalysis, Finding } from './analysis'
import type { GeminiOutput, AeoGeminiOutput } from './gemini'
import type { Grade, CategoryScore, PrioritizedAction, ExecutiveSummary } from './report'

export interface AnalyzeRequest {
  url: string
}

export interface AnalyzeResponse {
  analysisId: string
}

export interface BasicAnalyzeResponse {
  analysisId?: string
  url: string
  title: string | null
  h1Count: number
  h2Count: number
  h3Count: number
  metaDescription: string | null
  overallScore: number
  overallGrade: Grade
  findings: Finding[]
  // Per-dimension scores
  seoScore: number
  headingHierarchyScore: number
  semanticHtmlScore: number
  structuredDataScore: number
  robotsScore: number
  sitemapScore: number
  imageAccessibilityScore: number
  performanceScore: number
  // Extended analysis data
  semanticElements: { detected: string[]; missing: string[] }
  detectedSchemas: string[]
  robotsData: { exists: boolean; userAgents: string[]; sitemapUrls: string[] }
  sitemapData: { exists: boolean; urlCount: number | null }
  imageData: { totalImages: number; imagesWithAlt: number; imagesWithoutAlt: number; coveragePercent: number }
  pageSpeedData: {
    performanceScore: number | null
    fcp: { value: number; display: string } | null
    lcp: { value: number; display: string } | null
    cls: { value: number; display: string } | null
    inp: { value: number; display: string } | null
    tbt: { value: number; display: string } | null
    speedIndex: { value: number; display: string } | null
    debug?: string
  }
  // Professional report data
  categories: CategoryScore[]
  prioritizedActions: PrioritizedAction[]
  executiveSummary: ExecutiveSummary
  // Best-effort Gemini recommendations
  geminiOutput?: GeminiOutput
  // AEO (Answer Engine Optimization)
  aeoScore: number | null
  aeoAnalysis?: AeoGeminiOutput
  aeoData: {
    title: string | null
    metaDescription: string | null
    headings: { h1: string[]; h2: string[]; h3: string[] }
    visibleContentSnippet: string
    schemaTypes: string[]
    robotsTxtExists: boolean
    sitemapExists: boolean
    llmsTxt: { exists: boolean; contentLength: number | null }
  }
}

export interface AnalyzeStatusResponse {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  overallScore: number | null
}

export interface FullResultsResponse extends Analysis {
  pageData: PageData | null
  coreWebVitals: CoreWebVitals | null
  aiAnalysis: AiAnalysis | null
}

export interface HistoryItem {
  id: string
  url: string
  overallScore: number | null
  createdAt: string
}

export interface HistoryResponse {
  analyses: HistoryItem[]
  total: number
}
