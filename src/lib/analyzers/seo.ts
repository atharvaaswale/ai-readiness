// ------------------------------------------------------------------
// SEO Analyzer
//
// Purpose:
//   Extracts and scores SEO-relevant page data: <title> and
//   <meta name="description">. Heading analysis moved to the
//   dedicated heading hierarchy analyzer (structure.ts).
//
// Responsibility:
//   - Extracts <title> text content
//   - Extracts <meta name="description"> content
//   - Scores: title presence + length, meta presence + length
//   - Returns SeoResult with 0–100 score + findings
//
// Dependencies:
//   - cheerio (DOM parser)
//   - types/analysis.ts (SeoResult, Finding)
// ------------------------------------------------------------------

import * as cheerio from 'cheerio'
import type { SeoResult, Finding } from '@/types/analysis'

export function analyzeSeo(html: string): SeoResult {
  const $ = cheerio.load(html)

  const title = $('title').first().text().trim() || null

  const metaTag = $('meta').filter((_i, el) => {
    const name = $(el).attr('name')?.toLowerCase()
    const prop = $(el).attr('property')?.toLowerCase()
    return name === 'description' || prop === 'description'
  }).first()
  const metaDescription: string | null = metaTag.attr('content')?.trim() || null

  const findings: Finding[] = []
  let score = 0

  // Title checks
  if (title) {
    score += 30
    findings.push({ category: 'SEO - Title', passed: true, description: 'Page has a title tag' })
    if (title.length <= 60) {
      score += 20
      findings.push({ category: 'SEO - Title', passed: true, description: `Title length is ${title.length} characters (within 60 char limit)` })
    } else {
      findings.push({ category: 'SEO - Title', passed: false, description: `Title length is ${title.length} characters (exceeds 60 char limit)` })
    }
  } else {
    findings.push({ category: 'SEO - Title', passed: false, description: 'Page is missing a <title> tag' })
  }

  // Meta description checks
  if (metaDescription) {
    score += 30
    findings.push({ category: 'SEO - Meta', passed: true, description: 'Page has a meta description' })
    if (metaDescription.length <= 160) {
      score += 20
      findings.push({ category: 'SEO - Meta', passed: true, description: `Meta description length is ${metaDescription.length} characters (within 160 char limit)` })
    } else {
      findings.push({ category: 'SEO - Meta', passed: false, description: `Meta description length is ${metaDescription.length} characters (exceeds 160 char limit)` })
    }
  } else {
    findings.push({ category: 'SEO - Meta', passed: false, description: 'Page is missing a meta description' })
  }

  return { score, findings, title, metaDescription }
}
