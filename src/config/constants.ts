// ------------------------------------------------------------------
// Application Constants
//
// Purpose:
//   All tunable parameters in one place. No magic numbers in code.
//
// Responsibility:
//   Exports named constants for:
//   - Score weights per dimension
//   - Grade thresholds (A/B/C/D/F)
//   - Timeouts and size limits
//   - Retry configuration
//   - History limits
// -----------------------------------------------------------------/

import type { Dimension } from '@/types/analysis'
import type { Grade } from '@/types/scores'

export const SCORE_WEIGHTS: Record<Dimension, number> = {
  'ai-readiness': 0.25,
  'seo': 0.20,
  'structure': 0.15,
  'accessibility': 0.15,
  'performance': 0.15,
  'discoverability': 0.10,
}

export const GRADE_THRESHOLDS: Record<Grade, number> = {
  A: 90,
  B: 75,
  C: 60,
  D: 45,
  F: 0,
}

export const LIMITS = {
  HTML_FETCH_TIMEOUT_MS: 15_000,
  HTML_MAX_BYTES: 200_000,
  PAGESPEED_TIMEOUT_MS: 10_000,
  GEMINI_TIMEOUT_MS: 15_000,
  MAX_RETRIES: 3,
  HISTORY_LIMIT: 20,
  RECENT_DAYS_TTL: 30,
  MAX_REDIRECTS: 5,
} as const
