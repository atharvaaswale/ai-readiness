// ------------------------------------------------------------------
// Structure Analyzer
//
// Purpose:
//   Two deterministic Cheerio-based analyzers:
//   1. Heading hierarchy — counts H1–H3, detects structural issues
//   2. Semantic HTML — detects landmark elements
//
// Responsibility:
//   analyzeHeadingHierarchy(html):
//     - Counts <h1>, <h2>, <h3> elements
//     - Flags: missing H1, multiple H1, H3 without H2, H2 without H1
//     - Returns HeadingHierarchyResult (0–100 score)
//
//   analyzeSemanticHtml(html):
//     - Checks presence of: header, nav, main, article, section, footer
//     - Returns SemanticHtmlResult with detected/missing lists + score
//
// Dependencies:
//   - cheerio (DOM parser)
//   - types/analysis.ts (HeadingHierarchyResult, SemanticHtmlResult, Finding)
// ------------------------------------------------------------------

import * as cheerio from 'cheerio'
import type { HeadingHierarchyResult, SemanticHtmlResult, Finding } from '@/types/analysis'

const SEMANTIC_ELEMENTS = ['header', 'nav', 'main', 'article', 'section', 'footer'] as const

export function analyzeHeadingHierarchy(html: string): HeadingHierarchyResult {
  const $ = cheerio.load(html)

  const h1Count = $('h1').length
  const h2Count = $('h2').length
  const h3Count = $('h3').length

  const findings: Finding[] = []
  let score = 0

  // Missing H1
  if (h1Count === 0) {
    findings.push({ category: 'Heading Hierarchy', passed: false, description: 'Page is missing an <h1> heading' })
  } else {
    score += 25
    findings.push({ category: 'Heading Hierarchy', passed: true, description: 'Page has at least one <h1>' })
  }

  // Multiple H1
  if (h1Count > 1) {
    findings.push({ category: 'Heading Hierarchy', passed: false, description: `Page has ${h1Count} <h1> elements (best practice: use exactly one)` })
  } else if (h1Count === 1) {
    score += 15
    findings.push({ category: 'Heading Hierarchy', passed: true, description: 'Page uses exactly one <h1> (best practice)' })
  }

  // H2 present
  if (h2Count > 0) {
    score += 25
    findings.push({ category: 'Heading Hierarchy', passed: true, description: `Found ${h2Count} <h2> element(s)` })
  } else {
    findings.push({ category: 'Heading Hierarchy', passed: false, description: 'No <h2> headings found (indicates shallow content structure)' })
  }

  // H3 without H2
  if (h3Count > 0 && h2Count === 0) {
    findings.push({ category: 'Heading Hierarchy', passed: false, description: '<h3> elements present without <h2> (skipped heading level)' })
  } else {
    score += 20
    if (h3Count > 0) {
      findings.push({ category: 'Heading Hierarchy', passed: true, description: `<h3> elements correctly nested under <h2>` })
    }
  }

  // H2 without H1
  if (h2Count > 0 && h1Count === 0) {
    findings.push({ category: 'Heading Hierarchy', passed: false, description: '<h2> elements present without <h1> (skipped heading level)' })
  } else if (h2Count > 0 && h1Count > 0) {
    score += 15
    findings.push({ category: 'Heading Hierarchy', passed: true, description: 'Heading hierarchy starts correctly with <h1> followed by <h2>' })
  }

  return { score, findings, h1Count, h2Count, h3Count }
}

export function analyzeSemanticHtml(html: string): SemanticHtmlResult {
  const $ = cheerio.load(html)

  const detected: string[] = []
  const missing: string[] = []
  const findings: Finding[] = []

  for (const element of SEMANTIC_ELEMENTS) {
    if ($(element).length > 0) {
      detected.push(element)
      findings.push({ category: 'Semantic HTML', passed: true, description: `<${element}> element is present` })
    } else {
      missing.push(element)
      findings.push({ category: 'Semantic HTML', passed: false, description: `<${element}> element is missing` })
    }
  }

  const score = Math.round((detected.length / SEMANTIC_ELEMENTS.length) * 100)

  return { score, findings, detected, missing }
}
