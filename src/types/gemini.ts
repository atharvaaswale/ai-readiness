// ------------------------------------------------------------------
// Gemini API Types
//
// Purpose:
//   Defines the request/response contract for Gemini API calls.
//   Separated from analysis.ts because this is an external interface
//   that may change independently.
//
// Responsibility:
//   - GeminiRequest: the prompt + config sent to Gemini
//   - GeminiResponse: the expected JSON shape returned by Gemini
//   - Used by lib/api/gemini.ts for runtime validation of LLM output
// -----------------------------------------------------------------/

import type { Recommendation } from './analysis'

export interface GeminiRequest {
  pageUrl: string
  pageTitle: string | null
  metaDescription: string | null
  seoAnalysis: {
    score: number
    totalChecks: number
    passedChecks: number
  }
  structureAnalysis: {
    score: number
    headingCount: number
    semanticElementCount: number
  }
  accessibilityAnalysis: {
    score: number
    imageAltCoverage: number  // percentage
  }
  discoverabilityAnalysis: {
    score: number
    hasStructuredData: boolean
    hasSitemap: boolean
  }
  performance: {
    score: number
    lcp: number | null
    cls: number | null
  }
}

export interface GeminiResponse {
  aiReadinessScore: number        // 0-100
  summary: string                 // 2-3 sentence overview
  strengths: string[]             // notable positive findings
  weaknesses: string[]            // critical gaps
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    dimension: string
    description: string
  }>
}
