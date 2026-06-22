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

export interface AnalyzeRequest {
  url: string
}

export interface AnalyzeResponse {
  analysisId: string
}

export interface BasicAnalyzeResponse {
  url: string
  title: string | null
  h1Count: number
  h2Count: number
  h3Count: number
  metaDescription: string | null
  overallScore: number
  findings: Finding[]
  // Per-dimension scores
  seoScore: number
  headingHierarchyScore: number
  semanticHtmlScore: number
  structuredDataScore: number
  robotsScore: number
  sitemapScore: number
  imageAccessibilityScore: number
  // Extended analysis data
  semanticElements: { detected: string[]; missing: string[] }
  detectedSchemas: string[]
  robotsData: { exists: boolean; userAgents: string[]; sitemapUrls: string[] }
  sitemapData: { exists: boolean; urlCount: number | null }
  imageData: { totalImages: number; imagesWithAlt: number; imagesWithoutAlt: number; coveragePercent: number }
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
