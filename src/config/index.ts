// ------------------------------------------------------------------
// Config Entry Point
//
// Purpose:
//   Single source of truth for all application configuration.
//   Validates required environment variables at startup.
//
// Responsibility:
//   - Imports and re-exports from constants.ts and prompts.ts
//   - Validates that all required env vars are set
//     (throws on missing required vars in production)
//   - Provides typed access to all config values
//
// Dependencies:
//   - config/constants.ts
//   - config/prompts.ts
//   - Environment variables (validated here)
// -----------------------------------------------------------------/

import { SCORE_WEIGHTS, GRADE_THRESHOLDS, LIMITS } from './constants'
import { buildGeminiPrompt } from './prompts'

function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'PAGESPEED_API_KEY',
    'GEMINI_API_KEY',
  ]

  for (const key of required) {
    if (!process.env[key]) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variable: ${key}`)
      }
      console.warn(`Warning: Missing environment variable: ${key}`)
    }
  }
}

validateEnv()

export const config = {
  weights: SCORE_WEIGHTS,
  grades: GRADE_THRESHOLDS,
  limits: LIMITS,
  prompts: {
    gemini: buildGeminiPrompt,
  },
}
