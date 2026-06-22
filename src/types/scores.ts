// ------------------------------------------------------------------
// Score Types
//
// Purpose:
//   Score-specific types, separated from analysis data for clarity.
//   Used by the scoring engine and display components.
//
// Responsibility:
//   Defines:
//   - Grade ('A' | 'B' | 'C' | 'D' | 'F')
//   - ScoredDimension (dimension + score + grade)
//   - OverallScore (total + grade + breakdown of 6 dimensions)
// -----------------------------------------------------------------/

import type { Dimension } from './analysis'

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface ScoredDimension {
  dimension: Dimension
  score: number
  grade: Grade
  label: string
}

export interface OverallScore {
  overall: number
  grade: Grade
  dimensions: ScoredDimension[]
}
