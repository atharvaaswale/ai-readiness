// ------------------------------------------------------------------
// Robots.txt Analyzer
//
// Purpose:
//   Fetches and parses /robots.txt from the target origin to assess
//   crawler accessibility and sitemap references.
//
// Responsibility:
//   - Fetches {origin}/robots.txt with 5s timeout
//   - Treats 404 / fetch failure as "does not exist" (non-fatal)
//   - Extracts User-agent directives
//   - Extracts Sitemap references
//   - Returns RobotsResult with score + findings
//
// Dependencies:
//   - types/analysis.ts (RobotsResult, Finding)
// ------------------------------------------------------------------

import type { RobotsResult, Finding } from '@/types/analysis'

function extractOrigin(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}`
  } catch {
    return url
  }
}

export async function analyzeRobots(pageUrl: string): Promise<RobotsResult> {
  const origin = extractOrigin(pageUrl)
  const robotsUrl = `${origin}/robots.txt`
  const findings: Finding[] = []

  let content: string | null = null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5_000)
    const response = await fetch(robotsUrl, {
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (response.ok) {
      content = await response.text()
    } else {
      findings.push({
        category: 'Robots.txt',
        passed: false,
        description: `/robots.txt returned HTTP ${response.status} — not accessible`,
      })
      return { score: 0, findings, exists: false, content: null, userAgents: [], sitemapUrls: [] }
    }
  } catch {
    findings.push({
      category: 'Robots.txt',
      passed: false,
      description: '/robots.txt could not be fetched',
    })
    return { score: 0, findings, exists: false, content: null, userAgents: [], sitemapUrls: [] }
  }

  // Parse content
  const userAgents: string[] = []
  const sitemapUrls: string[] = []

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('User-agent') || trimmed.startsWith('user-agent')) {
      const value = trimmed.split(':').slice(1).join(':').trim()
      if (value && !userAgents.includes(value)) {
        userAgents.push(value)
      }
    }
    if (trimmed.toLowerCase().startsWith('sitemap')) {
      const value = trimmed.split(':').slice(1).join(':').trim()
      if (value) {
        sitemapUrls.push(value)
      }
    }
  }

  let score = 0

  if (content.length > 0) {
    score += 40
    findings.push({
      category: 'Robots.txt',
      passed: true,
      description: `/robots.txt exists (${content.length} bytes)`,
    })
  }

  if (userAgents.length > 0) {
    score += 30
    findings.push({
      category: 'Robots.txt',
      passed: true,
      description: `Found ${userAgents.length} User-agent directive(s): ${userAgents.join(', ')}`,
    })
  } else {
    findings.push({
      category: 'Robots.txt',
      passed: false,
      description: 'No User-agent directives found in robots.txt',
    })
  }

  if (sitemapUrls.length > 0) {
    score += 30
    findings.push({
      category: 'Robots.txt',
      passed: true,
      description: `Found ${sitemapUrls.length} Sitemap reference(s)`,
    })
  } else {
    findings.push({
      category: 'Robots.txt',
      passed: false,
      description: 'No Sitemap references in robots.txt',
    })
  }

  return { score, findings, exists: true, content, userAgents, sitemapUrls }
}
