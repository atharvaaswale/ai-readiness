import type { CategoryScore, CategoryId, Grade } from '@/types/report'
import { computeGrade } from './grading'

interface CategoryDef {
  id: CategoryId
  label: string
  dimensionKeys: string[]
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'technical-seo',
    label: 'Technical SEO',
    dimensionKeys: ['seoScore', 'robotsScore', 'sitemapScore'],
  },
  {
    id: 'content-structure',
    label: 'Content Structure',
    dimensionKeys: ['headingHierarchyScore', 'semanticHtmlScore'],
  },
  {
    id: 'ai-discoverability',
    label: 'AI Discoverability',
    dimensionKeys: ['structuredDataScore'],
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    dimensionKeys: ['imageAccessibilityScore'],
  },
  {
    id: 'performance',
    label: 'Performance',
    dimensionKeys: ['performanceScore'],
  },
]

export function computeCategories(dimensionScores: Record<string, number>): CategoryScore[] {
  return CATEGORIES.map((cat) => {
    const scores = cat.dimensionKeys.map((k) => dimensionScores[k] ?? 0)
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const grade = computeGrade(avg)
    return {
      id: cat.id,
      label: cat.label,
      score: avg,
      grade,
      dimensionScores: scores,
      findingsCount: 0,
      passedCount: 0,
    }
  })
}

export function updateCategoryFindings(
  categories: CategoryScore[],
  totalFindingsByCategory: Record<string, { total: number; passed: number }>
): CategoryScore[] {
  return categories.map((cat) => ({
    ...cat,
    findingsCount: totalFindingsByCategory[cat.id]?.total ?? 0,
    passedCount: totalFindingsByCategory[cat.id]?.passed ?? 0,
  }))
}
