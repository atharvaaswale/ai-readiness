// ------------------------------------------------------------------
// Structured Data / AI Discoverability Analyzer
//
// Purpose:
//   Detects structured data (JSON-LD) embedded in the page and
//   identifies common Schema.org types.
//
// Responsibility:
//   - Finds all <script type="application/ld+json"> blocks
//   - Parses and extracts @type values
//   - Recognizes: Organization, FAQPage, Article, Product, LocalBusiness
//   - Returns StructuredDataResult with detected schemas + score
//
// Dependencies:
//   - cheerio (DOM parser)
//   - types/analysis.ts (StructuredDataResult, Finding)
// ------------------------------------------------------------------

import * as cheerio from 'cheerio'
import type { StructuredDataResult, Finding } from '@/types/analysis'

const RECOGNIZED_TYPES = [
  'Organization',
  'FAQPage',
  'Article',
  'Product',
  'LocalBusiness',
]

export function analyzeStructuredData(html: string): StructuredDataResult {
  const $ = cheerio.load(html)
  const findings: Finding[] = []

  // Extract all JSON-LD blocks
  const scripts: string[] = []
  $('script[type="application/ld+json"]').each((_i, el) => {
    const content = $(el).text().trim()
    if (content) {
      scripts.push(content)
    }
  })

  const detectedSchemas: string[] = []

  if (scripts.length === 0) {
    findings.push({ category: 'Structured Data', passed: false, description: 'No JSON-LD structured data found on the page' })
    return { score: 0, findings, detectedSchemas }
  }

  findings.push({ category: 'Structured Data', passed: true, description: `Found ${scripts.length} JSON-LD block(s)` })

  // Parse each script block for @type
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script)

      // Handle both single object and array / @graph
      const items = parsed['@graph'] ?? [parsed]

      for (const item of Array.isArray(items) ? items : [items]) {
        const type = item['@type']
        if (!type) continue

        const types = Array.isArray(type) ? type : [type]

        for (const t of types) {
          if (RECOGNIZED_TYPES.includes(t) && !detectedSchemas.includes(t)) {
            detectedSchemas.push(t)
            findings.push({ category: 'Structured Data', passed: true, description: `Detected schema type: ${t}` })
          }
        }
      }
    } catch {
      findings.push({ category: 'Structured Data', passed: false, description: 'One or more JSON-LD blocks contain invalid JSON' })
    }
  }

  // Score calculation
  let score = 50 // base for having any JSON-LD
  if (detectedSchemas.length >= 3) {
    score = 100
  } else if (detectedSchemas.length >= 1) {
    score = 50 + detectedSchemas.length * 15
  }
  score = Math.min(score, 100)

  if (detectedSchemas.length === 0 && scripts.length > 0) {
    findings.push({ category: 'Structured Data', passed: false, description: 'JSON-LD present but no recognized schema types detected' })
    score = 30
  }

  return { score, findings, detectedSchemas }
}
