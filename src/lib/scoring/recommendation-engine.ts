import type { Finding } from '@/types/analysis'
import type { PrioritizedAction, Severity, ImpactArea } from '@/types/report'

const CATEGORY_MAP: Record<string, { area: ImpactArea; criticalFindings: string[]; highFindings: string[] }> = {
  'SEO - Title': {
    area: 'SEO',
    criticalFindings: ['missing a <title> tag'],
    highFindings: [],
  },
  'SEO - Meta': {
    area: 'SEO',
    criticalFindings: ['missing a meta description'],
    highFindings: [],
  },
  'SEO - Viewport': {
    area: 'Technical',
    criticalFindings: [],
    highFindings: [],
  },
  'SEO - Language': {
    area: 'Technical',
    criticalFindings: [],
    highFindings: [],
  },
  'Heading Hierarchy': {
    area: 'AI Discoverability',
    criticalFindings: ['No <h1> heading found'],
    highFindings: ['No <h2> headings found', 'Missing heading hierarchy'],
  },
  'Semantic HTML': {
    area: 'AI Discoverability',
    criticalFindings: [],
    highFindings: ['<main> element is missing'],
  },
  'Structured Data': {
    area: 'AI Discoverability',
    criticalFindings: ['No JSON-LD structured data found on the page'],
    highFindings: [],
  },
  'Image Accessibility': {
    area: 'Accessibility',
    criticalFindings: [],
    highFindings: [],
  },
  'Robots.txt': {
    area: 'Technical',
    criticalFindings: [],
    highFindings: [],
  },
  'Sitemap': {
    area: 'Technical',
    criticalFindings: [],
    highFindings: [],
  },
}

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low']

function classifySeverity(finding: Finding): Severity {
  const map = CATEGORY_MAP[finding.category]
  if (!map) return 'low'

  if (map.criticalFindings.some((k) => finding.description.toLowerCase().includes(k.toLowerCase()))) {
    return 'critical'
  }
  if (map.highFindings.some((k) => finding.description.toLowerCase().includes(k.toLowerCase()))) {
    return 'high'
  }
  if (finding.category === 'Structured Data' || finding.category === 'Semantic HTML') {
    return 'medium'
  }
  if (finding.category === 'SEO - Title' || finding.category === 'SEO - Meta') {
    return 'high'
  }
  return 'medium'
}

function classifyImpactArea(finding: Finding): ImpactArea {
  return CATEGORY_MAP[finding.category]?.area ?? 'Technical'
}

function computeImpactScore(severity: Severity, finding: Finding): number {
  let base = severity === 'critical' ? 90 : severity === 'high' ? 70 : severity === 'medium' ? 40 : 10
  if (finding.category === 'SEO - Title' || finding.category === 'SEO - Meta') base += 10
  if (finding.category === 'Structured Data') base -= 5
  if (finding.category === 'Sitemap') base -= 10
  return Math.min(100, Math.max(1, base))
}

export function prioritizeFindings(findings: Finding[]): PrioritizedAction[] {
  const failed = findings.filter((f) => !f.passed)
  const actions: PrioritizedAction[] = failed.map((finding) => {
    const severity = classifySeverity(finding)
    const impactArea = classifyImpactArea(finding)
    const impactScore = computeImpactScore(severity, finding)
    return { finding, severity, impactArea, impactScore }
  })
  actions.sort((a, b) => {
    const aIdx = SEVERITY_ORDER.indexOf(a.severity)
    const bIdx = SEVERITY_ORDER.indexOf(b.severity)
    if (aIdx !== bIdx) return aIdx - bIdx
    return b.impactScore - a.impactScore
  })
  return actions
}
