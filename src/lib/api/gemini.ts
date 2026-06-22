import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GeminiOutput } from '@/types/gemini'
import type { BasicAnalyzeResponse } from '@/types/api'
import { buildGeminiPrompt } from '@/config/prompts'

const MODEL = 'gemini-2.5-flash'
const TIMEOUT_MS = 15_000
const MAX_RETRIES = 2
const BASE_DELAY_MS = 1_000

function getClient(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  return new GoogleGenerativeAI(key)
}

function isRetryable(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (e.status === 429) return true
    if (e.status === 503) return true
    if ((e.message as string)?.includes('429')) return true
    if ((e.message as string)?.includes('503')) return true
    if ((e.message as string)?.includes('Too Many Requests')) return true
    if ((e.message as string)?.includes('quota')) return true
    if ((e.message as string)?.includes('unavailable')) return true
  }
  return false
}

function validateOutput(data: unknown): data is GeminiOutput {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (typeof d.summary !== 'string') return false
  if (!Array.isArray(d.topPriorities) || !d.topPriorities.every((p) => typeof p === 'string')) return false
  if (!Array.isArray(d.recommendations)) return false
  for (const rec of d.recommendations) {
    if (!rec || typeof rec !== 'object') return false
    const r = rec as Record<string, unknown>
    if (!['critical', 'high', 'medium', 'low'].includes(r.priority as string)) return false
    if (typeof r.dimension !== 'string') return false
    if (typeof r.action !== 'string') return false
    if (typeof r.impact !== 'string') return false
  }
  return true
}

async function attemptGenerate(
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  prompt: string,
  signal: AbortSignal,
  attempt: number
): Promise<GeminiOutput | null> {
  try {
    const response = await model.generateContent(prompt, { signal })
    const text = response.response.text()

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch (parseErr) {
      console.error('[Gemini] JSON parse error:', parseErr)
      return null
    }

    if (!validateOutput(parsed)) {
      console.error('[Gemini] Schema validation failed for parsed output')
      return null
    }

    return parsed as GeminiOutput
  } catch (err) {
    const retryable = isRetryable(err)
    console.error(
      `[Gemini] Attempt ${attempt}/${MAX_RETRIES + 1} failed${retryable ? ' (retryable)' : ''}:`,
      err && typeof err === 'object' ? (err as Record<string, unknown>).message || err : err
    )
    if (!retryable || attempt >= MAX_RETRIES) return null
    throw err // re-throw for outer retry loop
  }
}

export async function callGemini(results: BasicAnalyzeResponse): Promise<GeminiOutput | null> {
  const genAI = getClient()
  if (!genAI) return null

  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  })

  const prompt = buildGeminiPrompt(results)

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const result = await attemptGenerate(model, prompt, controller.signal, attempt + 1)
      return result
    } catch (err) {
      clearTimeout(timeoutId)
      const delay = BASE_DELAY_MS * Math.pow(2, attempt)
      console.error(`[Gemini] Retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return null
}
