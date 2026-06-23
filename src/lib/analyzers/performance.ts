import type { PerformanceResult, Finding } from '@/types/analysis'
import type { PageSpeedData } from '@/lib/api/pagespeed'

function generateFindings(data: PageSpeedData): Finding[] {
  const findings: Finding[] = []

  if (data.performanceScore === null) {
    findings.push({
      category: 'Performance',
      passed: false,
      description: 'PageSpeed Insights data could not be fetched',
    })
    return findings
  }

  if (data.performanceScore >= 90) {
    findings.push({
      category: 'Performance',
      passed: true,
      description: `Overall performance score is excellent (${data.performanceScore}/100)`,
    })
  } else if (data.performanceScore >= 50) {
    findings.push({
      category: 'Performance',
      passed: true,
      description: `Overall performance score needs improvement (${data.performanceScore}/100)`,
    })
  } else {
    findings.push({
      category: 'Performance',
      passed: false,
      description: `Overall performance score is poor (${data.performanceScore}/100)`,
    })
  }

  if (data.fcp) {
    if (data.fcp.value > 3000) {
      findings.push({
        category: 'Performance',
        passed: false,
        description: `First Contentful Paint is slow (${data.fcp.display})`,
      })
    } else if (data.fcp.value > 1800) {
      findings.push({
        category: 'Performance',
        passed: true,
        description: `First Contentful Paint is moderate (${data.fcp.display})`,
      })
    } else {
      findings.push({
        category: 'Performance',
        passed: true,
        description: `First Contentful Paint is fast (${data.fcp.display})`,
      })
    }
  }

  if (data.lcp) {
    if (data.lcp.value > 4000) {
      findings.push({
        category: 'Performance',
        passed: false,
        description: `Largest Contentful Paint is slow (${data.lcp.display})`,
      })
    } else if (data.lcp.value > 2500) {
      findings.push({
        category: 'Performance',
        passed: true,
        description: `Largest Contentful Paint is moderate (${data.lcp.display})`,
      })
    } else {
      findings.push({
        category: 'Performance',
        passed: true,
        description: `Largest Contentful Paint is fast (${data.lcp.display})`,
      })
    }
  }

  if (data.cls !== null && data.cls !== undefined) {
    if (data.cls.value > 0.25) {
      findings.push({
        category: 'Performance',
        passed: false,
        description: `Cumulative Layout Shift is poor (${data.cls.display})`,
      })
    } else if (data.cls.value > 0.1) {
      findings.push({
        category: 'Performance',
        passed: true,
        description: `Cumulative Layout Shift needs improvement (${data.cls.display})`,
      })
    } else {
      findings.push({
        category: 'Performance',
        passed: true,
        description: `Cumulative Layout Shift is good (${data.cls.display})`,
      })
    }
  }

  if (data.tbt) {
    if (data.tbt.value > 600) {
      findings.push({
        category: 'Performance',
        passed: false,
        description: `Total Blocking Time is high (${data.tbt.display})`,
      })
    } else if (data.tbt.value > 200) {
      findings.push({
        category: 'Performance',
        passed: true,
        description: `Total Blocking Time is moderate (${data.tbt.display})`,
      })
    } else {
      findings.push({
        category: 'Performance',
        passed: true,
        description: `Total Blocking Time is low (${data.tbt.display})`,
      })
    }
  }

  if (data.inp) {
    if (data.inp.value > 500) {
      findings.push({
        category: 'Performance',
        passed: false,
        description: `Interaction to Next Paint is poor (${data.inp.display})`,
      })
    } else if (data.inp.value > 200) {
      findings.push({
        category: 'Performance',
        passed: true,
        description: `Interaction to Next Paint needs improvement (${data.inp.display})`,
      })
    } else {
      findings.push({
        category: 'Performance',
        passed: true,
        description: `Interaction to Next Paint is good (${data.inp.display})`,
      })
    }
  }

  if (data.speedIndex) {
    if (data.speedIndex.value > 4000) {
      findings.push({
        category: 'Performance',
        passed: false,
        description: `Speed Index is slow (${data.speedIndex.display})`,
      })
    } else if (data.speedIndex.value > 2500) {
      findings.push({
        category: 'Performance',
        passed: true,
        description: `Speed Index is moderate (${data.speedIndex.display})`,
      })
    } else {
      findings.push({
        category: 'Performance',
        passed: true,
        description: `Speed Index is fast (${data.speedIndex.display})`,
      })
    }
  }

  return findings
}

export function analyzePerformance(data: PageSpeedData): PerformanceResult {
  const findings = generateFindings(data)

  const score = data.performanceScore !== null ? data.performanceScore : 0

  return {
    score,
    findings,
    pageSpeedData: {
      performanceScore: data.performanceScore,
      fcp: data.fcp,
      lcp: data.lcp,
      cls: data.cls,
      inp: data.inp,
      tbt: data.tbt,
      speedIndex: data.speedIndex,
      debug: data.debug,
    },
  }
}
