// ------------------------------------------------------------------
// SEO Analyzer
//
// Purpose:
//   Extracts basic page data using Cheerio DOM parsing.
//   Serves as the foundation for all future DOM-based analyzers
//   (heading hierarchy, semantic HTML, accessibility, structured data).
//
// Responsibility:
//   - Parses raw HTML with Cheerio
//   - Extracts <title> text content
//   - Counts <h1> elements
//   - Extracts <meta name="description"> content
//   - Returns typed result with findings
//
// Dependencies:
//   - cheerio (DOM parser)
//   - types/analysis.ts (Finding)
// ------------------------------------------------------------------

import * as cheerio from 'cheerio'
import type { Finding } from '@/types/analysis'

export interface BasicPageData {
  title: string | null
  h1Count: number
  metaDescription: string | null
}

export function extractBasicPageData(html: string): BasicPageData {
  const $ = cheerio.load(html)

  const title = $('title').first().text().trim() || null

  const h1Count = $('h1').length

  let metaDescription: string | null = null
  $('meta').each((_i, el) => {
    const name = $(el).attr('name')?.toLowerCase()
    const prop = $(el).attr('property')?.toLowerCase()
    if (name === 'description' || prop === 'description') {
      const content = $(el).attr('content')
      if (content) {
        metaDescription = content.trim()
        return false // break
      }
    }
  })

  return { title, h1Count, metaDescription }
}

export function computeBasicScore(data: BasicPageData): {
  score: number
  findings: Finding[]
} {
  const findings: Finding[] = []
  let score = 0

  // Title checks
  if (data.title) {
    score += 25
    findings.push({
      category: 'Title',
      passed: true,
      description: 'Page has a title tag',
    })
    if (data.title.length <= 60) {
      score += 10
      findings.push({
        category: 'Title',
        passed: true,
        description: `Title length is ${data.title.length} characters (within 60 char limit)`,
      })
    } else {
      findings.push({
        category: 'Title',
        passed: false,
        description: `Title length is ${data.title.length} characters (exceeds 60 char limit)`,
      })
    }
  } else {
    findings.push({
      category: 'Title',
      passed: false,
      description: 'Page is missing a <title> tag',
    })
  }

  // H1 checks
  if (data.h1Count > 0) {
    score += 20
    findings.push({
      category: 'Headings',
      passed: true,
      description: `Found ${data.h1Count} <h1> element(s) on the page`,
    })
    if (data.h1Count === 1) {
      score += 10
      findings.push({
        category: 'Headings',
        passed: true,
        description: 'Page uses exactly one <h1> (best practice)',
      })
    } else {
      findings.push({
        category: 'Headings',
        passed: false,
        description: 'Page uses multiple <h1> elements (use only one)',
      })
    }
  } else {
    findings.push({
      category: 'Headings',
      passed: false,
      description: 'No <h1> heading found on the page',
    })
  }

  // Meta description checks
  if (data.metaDescription) {
    score += 25
    findings.push({
      category: 'Meta Description',
      passed: true,
      description: 'Page has a meta description',
    })
    if (data.metaDescription.length <= 160) {
      score += 10
      findings.push({
        category: 'Meta Description',
        passed: true,
        description: `Meta description length is ${data.metaDescription.length} characters (within 160 char limit)`,
      })
    } else {
      findings.push({
        category: 'Meta Description',
        passed: false,
        description: `Meta description length is ${data.metaDescription.length} characters (exceeds 160 char limit)`,
      })
    }
  } else {
    findings.push({
      category: 'Meta Description',
      passed: false,
      description: 'Page is missing a meta description',
    })
  }

  return { score, findings }
}
