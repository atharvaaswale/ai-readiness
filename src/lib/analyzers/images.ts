// ------------------------------------------------------------------
// Image Accessibility Analyzer
//
// Purpose:
//   Analyzes <img> elements on the page for alt text coverage,
//   a critical WCAG success criterion and AI-readiness signal.
//
// Responsibility:
//   - Counts all <img> elements
//   - Counts images with a non-empty alt attribute
//   - Calculates coverage = (withAlt / total) × 100
//   - Returns ImageAccessibilityResult with score + findings
//
// Dependencies:
//   - cheerio (DOM parser)
//   - types/analysis.ts (ImageAccessibilityResult, Finding)
// ------------------------------------------------------------------

import * as cheerio from 'cheerio'
import type { ImageAccessibilityResult, Finding } from '@/types/analysis'

export function analyzeImages(html: string): ImageAccessibilityResult {
  const $ = cheerio.load(html)
  const findings: Finding[] = []

  const images = $('img')
  const totalImages = images.length

  let imagesWithAlt = 0
  let imagesWithoutAlt = 0

  images.each((_i, el) => {
    const alt = $(el).attr('alt')
    if (alt !== undefined && alt !== null && alt.trim().length > 0) {
      imagesWithAlt++
    } else {
      imagesWithoutAlt++
    }
  })

  const coveragePercent =
    totalImages > 0
      ? Math.round((imagesWithAlt / totalImages) * 100)
      : 100 // No images = no violations

  if (totalImages === 0) {
    findings.push({
      category: 'Image Accessibility',
      passed: true,
      description: 'No images found on the page',
    })
  } else {
    findings.push({
      category: 'Image Accessibility',
      passed: true,
      description: `Found ${totalImages} image(s) on the page`,
    })

    if (imagesWithAlt > 0) {
      findings.push({
        category: 'Image Accessibility',
        passed: true,
        description: `${imagesWithAlt} image(s) have alt text`,
      })
    }

    if (imagesWithoutAlt > 0) {
      findings.push({
        category: 'Image Accessibility',
        passed: false,
        description: `${imagesWithoutAlt} image(s) are missing alt text`,
      })
    }

    if (coveragePercent >= 90) {
      findings.push({
        category: 'Image Accessibility',
        passed: true,
        description: `Alt text coverage: ${coveragePercent}% (excellent)`,
      })
    } else if (coveragePercent >= 50) {
      findings.push({
        category: 'Image Accessibility',
        passed: false,
        description: `Alt text coverage: ${coveragePercent}% (needs improvement)`,
      })
    } else {
      findings.push({
        category: 'Image Accessibility',
        passed: false,
        description: `Alt text coverage: ${coveragePercent}% (poor — most images lack alt text)`,
      })
    }
  }

  return {
    score: totalImages > 0 ? coveragePercent : 100,
    findings,
    totalImages,
    imagesWithAlt,
    imagesWithoutAlt,
    coveragePercent,
  }
}
