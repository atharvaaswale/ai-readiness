import type { Finding } from './analysis'

export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F'

export type ImpactArea = 'SEO' | 'AI Discoverability' | 'Accessibility' | 'Technical' | 'Performance'

export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type CategoryId = 'technical-seo' | 'content-structure' | 'ai-discoverability' | 'accessibility' | 'performance' | 'aeo'

export interface CategoryScore {
  id: CategoryId
  label: string
  score: number
  grade: Grade
  findingsCount: number
  passedCount: number
  dimensionScores: number[]
}

export interface PrioritizedFinding {
  finding: Finding
  severity: Severity
  impactArea: ImpactArea
  impactScore: number
}

export interface PrioritizedAction {
  finding: Finding
  severity: Severity
  impactArea: ImpactArea
  impactScore: number
}

export interface ExecutiveSummary {
  summary: string
  strengths: string[]
  weaknesses: string[]
}

export interface ReportData {
  overallScore: number
  overallGrade: Grade
  categories: CategoryScore[]
  prioritizedActions: PrioritizedAction[]
  executiveSummary: ExecutiveSummary
}
