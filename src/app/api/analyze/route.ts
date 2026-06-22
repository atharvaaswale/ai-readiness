// ------------------------------------------------------------------
// POST /api/analyze
//
// Purpose:
//   Synchronous endpoint. Validates URL, fetches HTML, extracts basic
//   page data, computes a score, and returns results immediately.
//
// Responsibility:
//   - Parses and validates request body
//   - Validates URL format via validateUrl()
//   - Fetches HTML via fetchHtml() (single GET — proves reachability)
//   - Extracts title, h1 count, meta description via Cheerio
//   - Computes score based on extraction results
//   - Returns typed JSON response or appropriate error
//
// Dependencies:
//   - lib/validators/url.ts (validateUrl)
//   - lib/html/fetcher.ts (fetchHtml)
//   - lib/analyzers/seo.ts (extractBasicPageData, computeBasicScore)
//   - lib/utils/errors.ts (AnalysisError)
//   - types/api.ts (BasicAnalyzeResponse)
// ------------------------------------------------------------------

import { validateUrl } from '@/lib/validators/url'
import { fetchHtml } from '@/lib/html/fetcher'
import { extractBasicPageData, computeBasicScore } from '@/lib/analyzers/seo'
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

    const pageData = extractBasicPageData(page.html)

    const { score, findings } = computeBasicScore(pageData)

    const response: BasicAnalyzeResponse = {
      url: page.finalUrl,
      title: pageData.title,
      h1Count: pageData.h1Count,
      metaDescription: pageData.metaDescription,
      overallScore: score,
      findings,
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
