import type { BasicAnalyzeResponse } from '@/types/api'
import type { AeoExtractedContent } from '@/types/analysis'

function buildFindingsContext(results: BasicAnalyzeResponse): string {
  const lines: string[] = []
  lines.push(`URL: ${results.url}`)
  lines.push(`Overall Score: ${results.overallScore}`)
  lines.push(``)
  lines.push(`Dimension Scores:`)
  lines.push(`  SEO:                ${results.seoScore}/100`)
  lines.push(`  Heading Hierarchy:  ${results.headingHierarchyScore}/100`)
  lines.push(`  Semantic HTML:      ${results.semanticHtmlScore}/100`)
  lines.push(`  Structured Data:    ${results.structuredDataScore}/100`)
  lines.push(`  Image Accessibility:${results.imageAccessibilityScore}/100`)
  lines.push(`  Robots.txt:         ${results.robotsScore}/100`)
  lines.push(`  Sitemap:            ${results.sitemapScore}/100`)
  lines.push(`  Performance:        ${results.performanceScore}/100`)
  lines.push(``)
  lines.push(`Passed Checks: ${results.findings.filter(f => f.passed).length}/${results.findings.length}`)
  lines.push(``)
  lines.push(`Failures:`)
  for (const f of results.findings) {
    if (!f.passed) lines.push(`  - ${f.description}`)
  }
  return lines.join('\n')
}

export function buildGeminiPrompt(results: BasicAnalyzeResponse): string {
  return `
You are an AI Readiness Advisor. Your ONLY job is to produce actionable recommendations based on the analysis data below.

You MUST NOT produce scores or re-evaluate the page. The scores are already calculated deterministically and are final.

<analysisData>
${buildFindingsContext(results)}
</analysisData>

Based on the data above, produce a JSON object with exactly this schema:

{
  "summary": "2-3 sentence summary of the page's AI readiness state",
  "topPriorities": ["2-3 high-level action items to focus on first"],
  "recommendations": [
    {
      "priority": "critical" | "high" | "medium" | "low",
      "dimension": "which dimension this relates to",
      "action": "what to do, in clear actionable language",
      "impact": "why this matters for AI readiness"
    }
  ]
}

Rules:
- Max 10 recommendations, ordered by priority (critical first, low last).
- Every recommendation must reference a specific finding from the failures above.
- Be concise and actionable — each action should be 1-2 sentences.
- Do NOT re-state the scores. Do NOT generate new scores.
- Only output valid JSON, no markdown formatting.
`.trim()
}

function buildAeoContext(content: AeoExtractedContent): string {
  const lines: string[] = []
  lines.push(`Title: ${content.title ?? '(none)'}`)
  lines.push(`Meta Description: ${content.metaDescription ?? '(none)'}`)
  lines.push(``)
  lines.push(`Headings:`)
  lines.push(`  H1: ${content.headings.h1.length} — ${content.headings.h1.join(' | ').slice(0, 200)}`)
  lines.push(`  H2: ${content.headings.h2.length} — ${content.headings.h2.join(' | ').slice(0, 200)}`)
  lines.push(`  H3: ${content.headings.h3.length} — ${content.headings.h3.join(' | ').slice(0, 200)}`)
  lines.push(``)
  lines.push(`Schema Types: ${content.schemaTypes.length > 0 ? content.schemaTypes.join(', ') : '(none)'}`)
  lines.push(`Robots.txt: ${content.robotsTxtExists ? 'exists' : 'missing'}`)
  lines.push(`Sitemap: ${content.sitemapExists ? 'exists' : 'missing'}`)
  lines.push(`llms.txt: ${content.llmsTxtExists ? `exists (${content.llmsTxtContentLength} bytes)` : 'missing'}`)
  lines.push(``)
  lines.push(`Visible Content (first 3000 chars):`)
  lines.push(content.visibleContentSnippet.slice(0, 3000))
  return lines.join('\n')
}

export function buildAeoPrompt(content: AeoExtractedContent): string {
  return `
You are an Answer Engine Optimization (AEO) expert. Evaluate how well this webpage's content is optimized for LLM-based answer engines (e.g., Google AI Overviews, ChatGPT, Perplexity, Bing Copilot).

Analyze the extracted page data below and return a JSON object with scores and recommendations.

<pageData>
${buildAeoContext(content)}
</pageData>

Return ONLY valid JSON with this exact schema (no markdown, no comments):

{
  "aeoScore": 0-100,
  "clarity": 0-100,
  "authority": 0-100,
  "answerability": 0-100,
  "entityRecognition": 0-100,
  "citationReadiness": 0-100,
  "summary": "1-3 sentence summary of the page's AEO readiness",
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", ...]
}

Scoring guidelines:
- aeoScore: Overall Answer Engine Optimization readiness (0-100)
- clarity: How clear and well-structured is the content? Consider heading hierarchy, concise writing, scannability.
- authority: Signals of expertise and trustworthiness (schema, robots/sitemap, llms.txt).
- answerability: How directly does the content answer likely user questions?
- entityRecognition: How well does the page define and surface entities (schema types, clear naming)?
- citationReadiness: How easy is it for LLMs to cite this content? (llms.txt, sitemap, structured data)

Rules:
- Be objective and evidence-based. Base scores on the provided data only.
- Provide 3-6 actionable recommendations.
- Only output valid JSON. No markdown formatting or code fences.
`.trim()
}
