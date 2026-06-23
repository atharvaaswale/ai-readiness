import type { BasicAnalyzeResponse } from '@/types/api'

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
