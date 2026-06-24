import * as cheerio from 'cheerio'
import type { Finding, LlmsTxtResult, AeoExtractedContent } from '@/types/analysis'

function extractOrigin(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}`
  } catch {
    return url
  }
}

export async function analyzeLlmsTxt(pageUrl: string): Promise<LlmsTxtResult> {
  const origin = extractOrigin(pageUrl)
  const llmsTxtUrl = `${origin}/llms.txt`
  const findings: Finding[] = []

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5_000)
    const response = await fetch(llmsTxtUrl, {
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (response.ok) {
      const content = await response.text()
      findings.push({
        category: 'AEO',
        passed: true,
        description: `/llms.txt exists (${content.length} bytes) — helps LLMs discover content`,
      })
      return { exists: true, contentLength: content.length, findings }
    }

    findings.push({
      category: 'AEO',
      passed: false,
      description: `/llms.txt returned HTTP ${response.status} — not accessible`,
    })
    return { exists: false, contentLength: null, findings }
  } catch {
    findings.push({
      category: 'AEO',
      passed: false,
      description: '/llms.txt could not be fetched — LLM discovery may be limited',
    })
    return { exists: false, contentLength: null, findings }
  }
}

export function extractAeoContent(
  html: string,
  robotsTxtExists: boolean,
  sitemapExists: boolean,
  llmsTxtResult: LlmsTxtResult
): AeoExtractedContent {
  const $ = cheerio.load(html)

  const title = $('title').first().text().trim() || null

  const metaTag = $('meta').filter((_i, el) => {
    const name = $(el).attr('name')?.toLowerCase()
    const prop = $(el).attr('property')?.toLowerCase()
    return name === 'description' || prop === 'description'
  }).first()
  const metaDescription: string | null = metaTag.attr('content')?.trim() || null

  const h1s: string[] = []
  $('h1').each((_i, el) => {
    const text = $(el).text().trim()
    if (text) h1s.push(text)
  })
  const h2s: string[] = []
  $('h2').each((_i, el) => {
    const text = $(el).text().trim()
    if (text) h2s.push(text)
  })
  const h3s: string[] = []
  $('h3').each((_i, el) => {
    const text = $(el).text().trim()
    if (text) h3s.push(text)
  })

  $('script, style, noscript, svg, iframe').remove()
  const bodyText = $('body').text()
  const cleaned = bodyText.replace(/\s+/g, ' ').trim()
  const visibleContentSnippet = cleaned.slice(0, 3000)

  const schemaTypes: string[] = []
  $('script[type="application/ld+json"]').each((_i, el) => {
    const content = $(el).text().trim()
    if (!content) return
    try {
      const parsed = JSON.parse(content)
      const items = parsed['@graph'] ?? [parsed]
      for (const item of Array.isArray(items) ? items : [items]) {
        const type = item['@type']
        if (!type) continue
        const types = Array.isArray(type) ? type : [type]
        for (const t of types) {
          if (typeof t === 'string' && !schemaTypes.includes(t)) {
            schemaTypes.push(t)
          }
        }
      }
    } catch {
      // skip invalid JSON-LD
    }
  })

  return {
    title,
    metaDescription,
    headings: { h1: h1s, h2: h2s, h3: h3s },
    visibleContentSnippet,
    schemaTypes,
    robotsTxtExists,
    sitemapExists,
    llmsTxtExists: llmsTxtResult.exists,
    llmsTxtContentLength: llmsTxtResult.contentLength,
  }
}
