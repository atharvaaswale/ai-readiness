import type { Finding } from '@/types/analysis'
import type { CategoryScore, ExecutiveSummary } from '@/types/report'

function describeScore(score: number): string {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'adequate'
  if (score >= 40) return 'poor'
  return 'very poor'
}

function buildStrengths(findings: Finding[], categories: CategoryScore[]): string[] {
  const result: string[] = []
  if (categories.find((c) => c.id === 'technical-seo' && c.score >= 75)) {
    result.push('Technical SEO fundamentals are solid')
  }
  if (categories.find((c) => c.id === 'ai-discoverability' && c.score >= 75)) {
    result.push('Good AI discoverability through structured data')
  }
  const passedSeo = findings.filter((f) => f.category.startsWith('SEO') && f.passed)
  if (passedSeo.length >= 2) {
    result.push('Strong metadata implementation')
  }
  if (categories.find((c) => c.id === 'content-structure' && c.score >= 75)) {
    result.push('Well-structured content with proper heading hierarchy')
  }
  if (categories.find((c) => c.id === 'accessibility' && c.score >= 75)) {
    result.push('Good image accessibility coverage')
  }
  if (categories.find((c) => c.id === 'performance' && c.score >= 75)) {
    result.push('Good performance with fast Core Web Vitals')
  }
  return result
}

function buildWeaknesses(findings: Finding[], categories: CategoryScore[]): string[] {
  const result: string[] = []
  const missingSemantic = findings.filter(
    (f) => f.category === 'Semantic HTML' && !f.passed
  )
  if (missingSemantic.length >= 3) {
    result.push('Limited semantic HTML structure')
  }
  if (categories.find((c) => c.id === 'ai-discoverability' && c.score < 60)) {
    result.push('Missing or incomplete structured data')
  }
  const missingAlt = findings.filter(
    (f) => f.category === 'Image Accessibility' && !f.passed
  )
  if (missingAlt.length > 0) {
    result.push('Image alt text gaps')
  }
  if (categories.find((c) => c.id === 'technical-seo' && c.score < 60)) {
    result.push('Technical SEO gaps requiring attention')
  }
  const headingIssues = findings.filter(
    (f) => f.category === 'Heading Hierarchy' && !f.passed
  )
  if (headingIssues.length > 0) {
    result.push('Heading hierarchy improvements needed')
  }
  if (categories.find((c) => c.id === 'performance' && c.score < 60)) {
    result.push('Page performance needs improvement')
  }
  return result
}

export function generateSummary(
  findings: Finding[],
  categories: CategoryScore[],
  overallScore: number
): ExecutiveSummary {
  const strengths = buildStrengths(findings, categories)
  const weaknesses = buildWeaknesses(findings, categories)

  const scoreDesc = describeScore(overallScore)
  const strengthText = strengths.length > 0
    ? `This website has ${strengths.slice(0, 2).join(' and ').toLowerCase()}.`
    : ''

  const weaknessText = weaknesses.length > 0
    ? `However, it has ${weaknesses.slice(0, 2).join(' and ').toLowerCase()}.`
    : ''

  const prioritized = findings.filter((f) => !f.passed).slice(0, 3)
  const impactText = prioritized.length > 0
    ? `The highest-impact improvements are: ${prioritized.map((f) => f.description.toLowerCase().replace(/^(no|missing)/i, 'fix')).join('; ')}.`
    : ''

  const summary = [
    `The overall AI Readiness score is ${overallScore}/100 (${scoreDesc}).`,
    strengthText,
    weaknessText,
    impactText,
  ]
    .filter(Boolean)
    .join(' ')

  return { summary, strengths, weaknesses }
}
