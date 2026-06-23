import type { Finding } from '@/types/analysis'
import type { ReportData, CategoryScore } from '@/types/report'
import { computeGrade } from './grading'
import { computeCategories, updateCategoryFindings } from './category-scoring'
import { prioritizeFindings } from './recommendation-engine'
import { generateSummary } from './summary-generator'

export function buildReport(
  overallScore: number,
  dimensionScores: Record<string, number>,
  findings: Finding[]
): ReportData {
  const overallGrade = computeGrade(overallScore)
  const categories: CategoryScore[] = computeCategories(dimensionScores)

  const findingsByCategory: Record<string, { total: number; passed: number }> = {}
  for (const f of findings) {
    const cat = mapFindingCategory(f.category)
    if (!findingsByCategory[cat]) findingsByCategory[cat] = { total: 0, passed: 0 }
    findingsByCategory[cat].total++
    if (f.passed) findingsByCategory[cat].passed++
  }
  const updatedCategories = updateCategoryFindings(categories, findingsByCategory)

  const prioritizedActions = prioritizeFindings(findings)
  const executiveSummary = generateSummary(findings, updatedCategories, overallScore)

  return {
    overallScore,
    overallGrade,
    categories: updatedCategories,
    prioritizedActions,
    executiveSummary,
  }
}

function mapFindingCategory(category: string): string {
  if (category.startsWith('SEO')) return 'technical-seo'
  if (category === 'Heading Hierarchy' || category === 'Semantic HTML') return 'content-structure'
  if (category === 'Structured Data') return 'ai-discoverability'
  if (category === 'Image Accessibility') return 'accessibility'
  if (category === 'Robots.txt' || category === 'Sitemap') return 'technical-seo'
  if (category === 'Performance') return 'performance'
  return 'technical-seo'
}
