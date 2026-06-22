export interface GeminiRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low'
  dimension: string
  action: string
  impact: string
}

export interface GeminiOutput {
  summary: string
  topPriorities: string[]
  recommendations: GeminiRecommendation[]
}
