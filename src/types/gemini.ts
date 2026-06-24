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

export interface AeoGeminiOutput {
  aeoScore: number
  clarity: number
  authority: number
  answerability: number
  entityRecognition: number
  citationReadiness: number
  summary: string
  recommendations: string[]
}
