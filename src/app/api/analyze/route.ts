// ------------------------------------------------------------------
// POST /api/analyze
//
// Purpose:
//   Synchronous endpoint. Validates URL, fetches HTML and auxiliary
//   resources (robots.txt, sitemap.xml), runs all deterministic
//   analyzers, computes multi-dimensional score, and returns results.
//
// Responsibility:
//   - Parses and validates request body
//   - Validates URL format via validateUrl()
//   - Fetches HTML via fetchHtml()
//   - Fetches and parses /robots.txt
//   - Fetches and parses XML sitemap
//   - Runs 7 analyzers: SEO, Heading Hierarchy, Semantic HTML,
//     Structured Data, Robots.txt, Sitemap, Image Accessibility
//   - Computes overall score = average of all 7 dimension scores
//   - Returns typed JSON response or appropriate error
//
// Dependencies:
//   - lib/validators/url.ts
//   - lib/html/fetcher.ts
//   - lib/analyzers/seo.ts
//   - lib/analyzers/structure.ts
//   - lib/analyzers/discoverability.ts
//   - lib/analyzers/robots.ts
//   - lib/analyzers/sitemap.ts
//   - lib/analyzers/images.ts
//   - lib/utils/errors.ts (AnalysisError)
//   - types/api.ts (BasicAnalyzeResponse)
// ------------------------------------------------------------------

import { validateUrl } from '@/lib/validators/url'
import { fetchHtml } from '@/lib/html/fetcher'
import { analyzeSeo } from '@/lib/analyzers/seo'
import { analyzeHeadingHierarchy, analyzeSemanticHtml } from '@/lib/analyzers/structure'
import { analyzeStructuredData } from '@/lib/analyzers/discoverability'
import { analyzeRobots } from '@/lib/analyzers/robots'
import { analyzeSitemap } from '@/lib/analyzers/sitemap'
import { analyzeImages } from '@/lib/analyzers/images'
import { AnalysisError } from '@/lib/utils/errors'
import type { BasicAnalyzeResponse } from '@/types/api'

export async function POST(request: Request) {
  try {
    let body: { url?: string }

    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!body.url || typeof body.url !== 'string') {
      return Response.json({ error: 'URL is required' }, { status: 400 })
    }

    const validation = validateUrl(body.url)
    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 })
    }

    const page = await fetchHtml(validation.url)
    const html = page.html

    // Run HTML-based analyzers (parallel-safe)
    const seoResult = analyzeSeo(html)
    const headingResult = analyzeHeadingHierarchy(html)
    const semanticResult = analyzeSemanticHtml(html)
    const sdResult = analyzeStructuredData(html)
    const imageResult = analyzeImages(html)

    // Run external-resource analyzers (fetch calls)
    const robotsResult = await analyzeRobots(page.finalUrl)
    const sitemapResult = await analyzeSitemap(page.finalUrl, robotsResult.sitemapUrls)

    // Combine all findings
    const allFindings = [
      ...seoResult.findings,
      ...headingResult.findings,
      ...semanticResult.findings,
      ...sdResult.findings,
      ...imageResult.findings,
      ...robotsResult.findings,
      ...sitemapResult.findings,
    ]

    // Compute overall score = average of all 7 dimension scores
    const dimensionScores = [
      seoResult.score,
      headingResult.score,
      semanticResult.score,
      sdResult.score,
      imageResult.score,
      robotsResult.score,
      sitemapResult.score,
    ]
    const overallScore = Math.round(
      dimensionScores.reduce((a, b) => a + b, 0) / dimensionScores.length
    )

    const response: BasicAnalyzeResponse = {
      url: page.finalUrl,
      title: seoResult.title,
      h1Count: headingResult.h1Count,
      h2Count: headingResult.h2Count,
      h3Count: headingResult.h3Count,
      metaDescription: seoResult.metaDescription,
      overallScore,
      findings: allFindings,
      seoScore: seoResult.score,
      headingHierarchyScore: headingResult.score,
      semanticHtmlScore: semanticResult.score,
      structuredDataScore: sdResult.score,
      robotsScore: robotsResult.score,
      sitemapScore: sitemapResult.score,
      imageAccessibilityScore: imageResult.score,
      semanticElements: {
        detected: semanticResult.detected,
        missing: semanticResult.missing,
      },
      detectedSchemas: sdResult.detectedSchemas,
      robotsData: {
        exists: robotsResult.exists,
        userAgents: robotsResult.userAgents,
        sitemapUrls: robotsResult.sitemapUrls,
      },
      sitemapData: {
        exists: sitemapResult.exists,
        urlCount: sitemapResult.urlCount,
      },
      imageData: {
        totalImages: imageResult.totalImages,
        imagesWithAlt: imageResult.imagesWithAlt,
        imagesWithoutAlt: imageResult.imagesWithoutAlt,
        coveragePercent: imageResult.coveragePercent,
      },
    }

    return Response.json(response)
  } catch (error) {
    if (error instanceof AnalysisError) {
      return Response.json(
        { error: error.userMessage },
        { status: error.statusCode }
      )
    }

    console.error('Unexpected analysis error:', error)
    return Response.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
