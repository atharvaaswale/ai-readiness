import { LIMITS } from '@/config/constants'

export interface PageSpeedMetric {
  value: number
  display: string
}

export interface PageSpeedData {
  performanceScore: number | null
  fcp: PageSpeedMetric | null
  lcp: PageSpeedMetric | null
  cls: PageSpeedMetric | null
  inp: PageSpeedMetric | null
  tbt: PageSpeedMetric | null
  speedIndex: PageSpeedMetric | null
  debug?: string
}

function emptyPageSpeedData(debug?: string): PageSpeedData {
  return {
    performanceScore: null,
    fcp: null,
    lcp: null,
    cls: null,
    inp: null,
    tbt: null,
    speedIndex: null,
    debug,
  }
}

function extractMetric(audits: Record<string, unknown> | undefined, key: string): PageSpeedMetric | null {
  if (!audits) return null
  const audit = audits[key] as Record<string, unknown> | undefined
  if (!audit) return null
  const numericValue = audit.numericValue as number | undefined
  const displayValue = audit.displayValue as string | undefined
  if (numericValue === undefined || displayValue === undefined) return null
  return { value: numericValue, display: displayValue }
}

function parsePageSpeedResponse(data: Record<string, unknown>, debugLog: string[]): PageSpeedData {
  const lighthouse = data.lighthouseResult as Record<string, unknown> | undefined
  if (!lighthouse) {
    debugLog.push('Response missing lighthouseResult')
    return emptyPageSpeedData(debugLog.join('; '))
  }

  const categories = lighthouse.categories as Record<string, unknown> | undefined
  if (!categories) {
    debugLog.push('lighthouseResult missing categories')
    return emptyPageSpeedData(debugLog.join('; '))
  }
  const performanceCategory = categories.performance as Record<string, unknown> | undefined
  if (!performanceCategory) {
    debugLog.push('categories missing performance')
    return emptyPageSpeedData(debugLog.join('; '))
  }
  const rawScore = performanceCategory.score as number | undefined
  if (rawScore === undefined) {
    debugLog.push('performance category missing score')
    return emptyPageSpeedData(debugLog.join('; '))
  }
  const performanceScore = Math.round(rawScore * 100)
  debugLog.push(`Performance score: ${performanceScore}`)

  const audits = lighthouse.audits as Record<string, unknown> | undefined
  if (!audits) {
    debugLog.push('lighthouseResult missing audits')
  }

  return {
    performanceScore,
    fcp: extractMetric(audits, 'first-contentful-paint'),
    lcp: extractMetric(audits, 'largest-contentful-paint'),
    cls: extractMetric(audits, 'cumulative-layout-shift'),
    inp: extractMetric(audits, 'interaction-to-next-paint'),
    tbt: extractMetric(audits, 'total-blocking-time'),
    speedIndex: extractMetric(audits, 'speed-index'),
  }
}

export async function fetchPageSpeed(url: string): Promise<PageSpeedData> {
  const debugLog: string[] = []
  const startTime = Date.now()

  const apiKey = process.env.GOOGLE_PSI_API_KEY
  if (!apiKey) {
    debugLog.push('GOOGLE_PSI_API_KEY env var is not set')
    console.error('[PageSpeed] API key not configured')
    return emptyPageSpeedData(debugLog.join('; '))
  }
  debugLog.push('API key loaded')
  console.log(`[PageSpeed] Starting request for ${url} at ${new Date(startTime).toISOString()}`)

  const targetApiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
  targetApiUrl.searchParams.append('url', url)
  targetApiUrl.searchParams.append('key', apiKey)
  targetApiUrl.searchParams.append('strategy', 'mobile')
  targetApiUrl.searchParams.append('category', 'performance')

  const requestUrl = targetApiUrl.toString()
  debugLog.push(`Request URL: ${requestUrl.replace(apiKey, 'REDACTED')}`)
  console.log(`[PageSpeed] GET ${requestUrl.replace(apiKey, 'REDACTED')}`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    const elapsed = Date.now() - startTime
    console.warn(`[PageSpeed] Aborting request after ${elapsed}ms (timeout: ${LIMITS.PAGESPEED_TIMEOUT_MS}ms)`)
    controller.abort()
  }, LIMITS.PAGESPEED_TIMEOUT_MS)

  try {
    const response = await fetch(requestUrl, { signal: controller.signal })
    const elapsed = Date.now() - startTime
    debugLog.push(`Response status: ${response.status} after ${elapsed}ms`)
    console.log(`[PageSpeed] Response received: status=${response.status}, elapsed=${elapsed}ms`)

    if (!response.ok) {
      const body = await response.text().catch(() => 'no body')
      debugLog.push(`Non-OK response: ${response.status}, body: ${body.substring(0, 500)}`)
      console.error(`[PageSpeed] API returned ${response.status}: ${body.substring(0, 200)}`)
      return emptyPageSpeedData(debugLog.join('; '))
    }

    const raw: Record<string, unknown> = await response.json()
    const parseElapsed = Date.now() - startTime
    debugLog.push('Response JSON parsed successfully')
    debugLog.push(`Top-level keys: ${Object.keys(raw).join(', ')}`)
    console.log(`[PageSpeed] JSON parsed: keys=${Object.keys(raw).length}, elapsed=${parseElapsed}ms`)

    const result = parsePageSpeedResponse(raw, debugLog)
    const totalElapsed = Date.now() - startTime
    console.log(`[PageSpeed] Completed successfully: score=${result.performanceScore}, elapsed=${totalElapsed}ms`)
    return result
  } catch (err) {
    const elapsed = Date.now() - startTime
    if (err && typeof err === 'object' && (err as Record<string, unknown>).name === 'AbortError') {
      debugLog.push(`Request timed out after ${elapsed}ms (limit: ${LIMITS.PAGESPEED_TIMEOUT_MS}ms)`)
      console.error(`[PageSpeed] Request timed out after ${elapsed}ms`)
    } else {
      const msg = err && typeof err === 'object'
        ? ((err as Record<string, unknown>).message as string) || String(err)
        : String(err)
      debugLog.push(`Fetch error at ${elapsed}ms: ${msg}`)
      console.error(`[PageSpeed] Fetch error at ${elapsed}ms:`, msg)
    }
    return emptyPageSpeedData(debugLog.join('; '))
  } finally {
    clearTimeout(timeoutId)
  }
}
