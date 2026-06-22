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
  metaDescription: string | null
  overallScore: number
  findings: Finding[]
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
