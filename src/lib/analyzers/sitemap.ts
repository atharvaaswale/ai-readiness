// ------------------------------------------------------------------
// Sitemap Analyzer
//
// Purpose:
//   Fetches the XML sitemap from the target origin to verify its
//   existence, validity, and estimate URL coverage.
//
// Responsibility:
//   - Tries URLs from robots.txt sitemap references first
//   - Falls back to {origin}/sitemap.xml
//   - Attempts XML parsing to count <url> entries
//   - Returns SitemapResult with score + findings
//
// Dependencies:
//   - types/analysis.ts (SitemapResult, Finding)
// ------------------------------------------------------------------

import type { SitemapResult, Finding } from '@/types/analysis'

function extractOrigin(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}`
  } catch {
    return url
  }
}

async function tryFetch(url: string): Promise<{ ok: boolean; text: string }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5_000)
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)
    if (response.ok) {
      const text = await response.text()
      return { ok: true, text }
    }
    return { ok: false, text: '' }
  } catch {
    return { ok: false, text: '' }
  }
}

function extractUrlCount(xml: string): number {
  // Count <url> or <urlset> entries (namespace-agnostic)
  const urlMatches = xml.match(/<url[>\s]/gi)
  if (urlMatches) return urlMatches.length

  // For sitemap index, count <sitemap> entries
  const sitemapMatches = xml.match(/<sitemap[>\s]/gi)
  if (sitemapMatches) return sitemapMatches.length

  return 0
}

export async function analyzeSitemap(
  pageUrl: string,
  robotsSitemapUrls: string[] = []
): Promise<SitemapResult> {
  const findings: Finding[] = []
  let fetchedText: string | null = null
  let fetchSource: string | null = null

  // Try robots.txt sitemap URLs first
  for (const su of robotsSitemapUrls) {
    const result = await tryFetch(su)
    if (result.ok) {
      fetchedText = result.text
      fetchSource = su
      break
    }
  }

  // Fall back to /sitemap.xml
  if (fetchedText === null) {
    const origin = extractOrigin(pageUrl)
    const result = await tryFetch(`${origin}/sitemap.xml`)
    if (result.ok) {
      fetchedText = result.text
      fetchSource = `${origin}/sitemap.xml`
    }
  }

  if (fetchedText === null) {
    findings.push({
      category: 'Sitemap',
      passed: false,
      description: 'No XML sitemap found',
    })
    return { score: 0, findings, exists: false, urlCount: null }
  }

  findings.push({
    category: 'Sitemap',
    passed: true,
    description: `Sitemap found at ${fetchSource}`,
  })

  // Validate basic XML structure
  const trimmed = fetchedText.trim()
  const looksLikeXml = trimmed.startsWith('<?xml') || trimmed.startsWith('<urlset') || trimmed.startsWith('<sitemapindex')

  if (!looksLikeXml) {
    findings.push({
      category: 'Sitemap',
      passed: false,
      description: 'Sitemap does not appear to be valid XML',
    })
    return { score: 20, findings, exists: true, urlCount: null }
  }

  let score = 40
  findings.push({
    category: 'Sitemap',
    passed: true,
    description: 'Sitemap is valid XML',
  })

  const urlCount = extractUrlCount(fetchedText)

  if (urlCount > 0) {
    score += 60
    findings.push({
      category: 'Sitemap',
      passed: true,
      description: `Sitemap contains approximately ${urlCount} URL(s)`,
    })
  } else {
    findings.push({
      category: 'Sitemap',
      passed: false,
      description: 'Sitemap exists but contains no URL entries',
    })
  }

  return { score, findings, exists: true, urlCount }
}
