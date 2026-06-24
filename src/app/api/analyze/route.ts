import { validateUrl } from '@/lib/validators/url'
import { fetchHtml } from '@/lib/html/fetcher'
import { analyzeSeo } from '@/lib/analyzers/seo'
import { analyzeHeadingHierarchy, analyzeSemanticHtml } from '@/lib/analyzers/structure'
import { analyzeStructuredData } from '@/lib/analyzers/discoverability'
import { analyzeRobots } from '@/lib/analyzers/robots'
import { analyzeSitemap } from '@/lib/analyzers/sitemap'
import { analyzeImages } from '@/lib/analyzers/images'
import { analyzePerformance } from '@/lib/analyzers/performance'
import { analyzeLlmsTxt, extractAeoContent } from '@/lib/analyzers/aeo'
import { fetchPageSpeed } from '@/lib/api/pagespeed'
import { AnalysisError } from '@/lib/utils/errors'
import { callGemini, callAeoGemini } from '@/lib/api/gemini'
import { buildReport } from '@/lib/scoring'
import { computeGrade } from '@/lib/scoring/grading'
import { createAnalysis, completeAnalysis, failAnalysis } from '@/lib/supabase/queries'
import type { BasicAnalyzeResponse } from '@/types/api'

export async function POST(request: Request) {
  let analysisId: string | null = null

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

    analysisId = await createAnalysis(body.url)

    const [page, pageSpeedData] = await Promise.all([
      fetchHtml(validation.url),
      fetchPageSpeed(validation.url),
    ])
    const html = page.html

    const seoResult = analyzeSeo(html)
    const headingResult = analyzeHeadingHierarchy(html)
    const semanticResult = analyzeSemanticHtml(html)
    const sdResult = analyzeStructuredData(html)
    const imageResult = analyzeImages(html)
    const performanceResult = analyzePerformance(pageSpeedData)

    const robotsResult = await analyzeRobots(page.finalUrl)
    const sitemapResult = await analyzeSitemap(page.finalUrl, robotsResult.sitemapUrls)
    const llmsTxtResult = await analyzeLlmsTxt(page.finalUrl)

    const aeoContent = extractAeoContent(
      html,
      robotsResult.exists,
      sitemapResult.exists,
      llmsTxtResult
    )

    const allFindings = [
      ...seoResult.findings,
      ...headingResult.findings,
      ...semanticResult.findings,
      ...sdResult.findings,
      ...imageResult.findings,
      ...performanceResult.findings,
      ...robotsResult.findings,
      ...sitemapResult.findings,
      ...llmsTxtResult.findings,
    ]

    const deterministicScoreValues = [
      seoResult.score,
      headingResult.score,
      semanticResult.score,
      sdResult.score,
      imageResult.score,
      performanceResult.score,
      robotsResult.score,
      sitemapResult.score,
    ]
    const deterministicOverall = Math.round(
      deterministicScoreValues.reduce((a, b) => a + b, 0) / deterministicScoreValues.length
    )

    const dimensionScores: Record<string, number> = {
      seoScore: seoResult.score,
      headingHierarchyScore: headingResult.score,
      semanticHtmlScore: semanticResult.score,
      structuredDataScore: sdResult.score,
      imageAccessibilityScore: imageResult.score,
      performanceScore: performanceResult.score,
      robotsScore: robotsResult.score,
      sitemapScore: sitemapResult.score,
    }

    const { overallGrade, categories, prioritizedActions, executiveSummary } = buildReport(
      deterministicOverall,
      dimensionScores,
      allFindings
    )

    const response: BasicAnalyzeResponse = {
      url: page.finalUrl,
      title: seoResult.title,
      h1Count: headingResult.h1Count,
      h2Count: headingResult.h2Count,
      h3Count: headingResult.h3Count,
      metaDescription: seoResult.metaDescription,
      overallScore: deterministicOverall,
      overallGrade,
      categories,
      prioritizedActions,
      executiveSummary,
      findings: allFindings,
      seoScore: seoResult.score,
      headingHierarchyScore: headingResult.score,
      semanticHtmlScore: semanticResult.score,
      structuredDataScore: sdResult.score,
      robotsScore: robotsResult.score,
      sitemapScore: sitemapResult.score,
      imageAccessibilityScore: imageResult.score,
      performanceScore: performanceResult.score,
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
      pageSpeedData: {
        performanceScore: performanceResult.pageSpeedData.performanceScore,
        fcp: performanceResult.pageSpeedData.fcp,
        lcp: performanceResult.pageSpeedData.lcp,
        cls: performanceResult.pageSpeedData.cls,
        inp: performanceResult.pageSpeedData.inp,
        tbt: performanceResult.pageSpeedData.tbt,
        speedIndex: performanceResult.pageSpeedData.speedIndex,
        debug: performanceResult.pageSpeedData.debug,
      },
      aeoScore: null,
      aeoData: {
        title: aeoContent.title,
        metaDescription: aeoContent.metaDescription,
        headings: aeoContent.headings,
        visibleContentSnippet: aeoContent.visibleContentSnippet,
        schemaTypes: aeoContent.schemaTypes,
        robotsTxtExists: aeoContent.robotsTxtExists,
        sitemapExists: aeoContent.sitemapExists,
        llmsTxt: {
          exists: llmsTxtResult.exists,
          contentLength: llmsTxtResult.contentLength,
        },
      },
    }

    const [geminiOutput, aeoAnalysis] = await Promise.all([
      callGemini(response).catch(() => null),
      callAeoGemini(aeoContent).catch(() => null),
    ])

    const aeoScore = aeoAnalysis?.aeoScore ?? null

    if (aeoScore !== null) {
      dimensionScores.aeoScore = aeoScore
    }

    const allScoreValues = Object.values(dimensionScores)
    const finalOverallScore = Math.round(
      allScoreValues.reduce((a, b) => a + b, 0) / allScoreValues.length
    )

    const finalResponse: BasicAnalyzeResponse = {
      ...response,
      overallScore: finalOverallScore,
      overallGrade: computeGrade(finalOverallScore),
      aeoScore,
      aeoAnalysis: aeoAnalysis ?? undefined,
      geminiOutput: geminiOutput ?? undefined,
      analysisId: analysisId ?? undefined,
    }

    if (analysisId) {
      await completeAnalysis(analysisId, response)
    }

    return Response.json(finalResponse)
  } catch (error) {
    if (analysisId) {
      const message = error instanceof AnalysisError ? error.userMessage : 'Analysis failed'
      await failAnalysis(analysisId, message)
    }

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
