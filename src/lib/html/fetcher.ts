// ------------------------------------------------------------------
// HTML Fetcher
//
// Purpose:
//   Fetches raw HTML from an arbitrary URL using a single GET request.
//   Handles timeouts, content-type validation, and payload truncation.
//
// Responsibility:
//   - Fetches URL with 15-second AbortController timeout
//   - Validates Content-Type includes text/html
//   - Truncates response body to 200KB max
//   - Returns { html, headers, finalUrl, statusCode }
//   - Throws HtmlFetchError on timeout, non-200, non-HTML, DNS failure
//
// Dependencies:
//   - lib/utils/errors.ts (HtmlFetchError)
// ------------------------------------------------------------------

import { HtmlFetchError } from '@/lib/utils/errors'

export interface FetchedPage {
  html: string
  headers: Record<string, string>
  finalUrl: string
  statusCode: number
}

const FETCH_TIMEOUT_MS = 15_000
const MAX_BYTES = 200_000

export async function fetchHtml(url: string): Promise<FetchedPage> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; AIReadinessAnalyzer/1.0; +https://github.com/ai-readiness)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })

    if (!response.ok) {
      throw new HtmlFetchError(
        `HTTP ${response.status}: ${response.statusText}`,
        `Server returned HTTP ${response.status} ${response.statusText}`
      )
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      throw new HtmlFetchError(
        `Unexpected content-type: ${contentType}`,
        'URL does not return HTML content'
      )
    }

    const rawHtml = await response.text()
    const html = rawHtml.slice(0, MAX_BYTES)

    return {
      html,
      headers: Object.fromEntries(response.headers.entries()),
      finalUrl: response.url,
      statusCode: response.status,
    }
  } catch (error) {
    if (error instanceof HtmlFetchError) {
      throw error
    }

    if ((error as Error).name === 'AbortError') {
      throw new HtmlFetchError(
        'Request timed out',
        'Page took too long to respond (timeout: 15s)'
      )
    }

    if ((error as TypeError)?.message?.includes('fetch')) {
      throw new HtmlFetchError(
        `Fetch failed: ${(error as Error).message}`,
        'Could not reach the URL. Check that the domain is correct.'
      )
    }

    throw new HtmlFetchError(
      (error as Error).message,
      'Failed to fetch the page. Please try again.'
    )
  } finally {
    clearTimeout(timeoutId)
  }
}
