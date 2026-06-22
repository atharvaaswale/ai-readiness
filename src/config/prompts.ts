// ------------------------------------------------------------------
// Gemini Prompts
//
// Purpose:
//   The Gemini system prompt is the most iterated piece of text in
//   the project. Separating it from code makes changes safe and
//   reviewable.
//
// Responsibility:
//   - Exports buildGeminiPrompt(pageData): string
//   - Constructs a system prompt instructing Gemini to:
//       1. Evaluate the page for AI-readiness
//       2. Produce structured JSON output matching GeminiResponse
//       3. Assign a score 0-100
//       4. List strengths, weaknesses, recommendations
//   - Uses XML-style <data> tags for the page context
//   - Declares response_mime_type: application/json
//
// Dependencies:
//   - types/gemini.ts (GeminiRequest, GeminiResponse)
// -----------------------------------------------------------------/

import type { GeminiRequest } from '@/types/gemini'

export function buildGeminiPrompt(pageData: GeminiRequest): string {
  return `
You are an AI Readiness Auditor. Analyze the following webpage data and produce a structured assessment.

<pageData>
${JSON.stringify(pageData, null, 2)}
</pageData>

Evaluate the page on:
1. Content clarity and semantic richness
2. How easily an LLM could extract entities and relationships
3. Structured data quality and completeness
4. Technical SEO that affects AI crawlers
5. Performance (poor performance reduces AI crawler budget)

Respond with valid JSON following this schema:
{
  "aiReadinessScore": number (0-100),
  "summary": string,
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": [{ "priority": "high"|"medium"|"low", "dimension": string, "description": string }]
}
`.trim()
}
