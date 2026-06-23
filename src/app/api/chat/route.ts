import { GoogleGenerativeAI } from '@google/generative-ai'
import type { BasicAnalyzeResponse } from '@/types/api'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  results: BasicAnalyzeResponse
  question: string
  messages: ChatMessage[]
}

const TIMEOUT_MS = 15_000

function buildChatPrompt(results: BasicAnalyzeResponse, question: string, history: ChatMessage[]): string {
  const reportContext = `
URL: ${results.url}
Overall Score: ${results.overallScore}/100 (${results.overallGrade})

Dimension Scores:
  SEO:                 ${results.seoScore}/100
  Heading Hierarchy:   ${results.headingHierarchyScore}/100
  Semantic HTML:       ${results.semanticHtmlScore}/100
  Structured Data:     ${results.structuredDataScore}/100
  Image Accessibility: ${results.imageAccessibilityScore}/100
  Performance:         ${results.performanceScore}/100
  Robots.txt:          ${results.robotsScore}/100
  Sitemap:             ${results.sitemapScore}/100

Categories:
${results.categories.map((c) => `  ${c.label}: ${c.grade} (${c.score}/100, ${c.passedCount}/${c.findingsCount} passed)`).join('\n')}

Failures:
${results.findings.filter((f) => !f.passed).map((f) => `  - [${f.category}] ${f.description}`).join('\n')}

Prioritized Actions:
${results.prioritizedActions.map((a) => `  [${a.severity}] ${a.impactArea}: ${a.finding.description}`).join('\n')}
`

  const conversationHistory = history
    .slice(0, -1)
    .map((m) => `${m.role === 'user' ? 'User' : 'Consultant'}: ${m.content}`)
    .join('\n')

  return `
You are an AI Readiness Consultant. You have access to a full website analysis report below.

Your role is to help the user understand their report and provide actionable advice.
Only answer based on the report data provided. Do NOT make up information.
If the question is outside the scope of the report, politely say you can only answer based on the analysis.

REPORT DATA:
${reportContext}

${conversationHistory ? `CONVERSATION SO FAR:\n${conversationHistory}\n` : ''}

User question: ${question}

Provide a clear, concise answer (2-5 sentences). Be specific and reference actual scores and findings from the report. Do NOT use markdown formatting.
`.trim()
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json()

    if (!body.results || !body.question) {
      return Response.json({ error: 'Missing results or question' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return Response.json({ answer: 'AI chat is not configured. Set GEMINI_API_KEY to enable this feature.' })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3,
      },
    })

    const prompt = buildChatPrompt(body.results, body.question, body.messages)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const result = await model.generateContent(prompt, {
        signal: controller.signal,
      })
      const text = result.response.text()
      return Response.json({ answer: text.trim() })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (err) {
    const message =
      err && typeof err === 'object'
        ? (err as Record<string, unknown>).message || 'Unknown error'
        : 'Unknown error'
    console.error('[Chat] Error:', message)
    return Response.json(
      { error: `Failed to generate response: ${message}` },
      { status: 500 }
    )
  }
}
