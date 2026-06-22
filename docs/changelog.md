# AI Readiness Analyzer — Changelog

> All notable changes to this project will be documented in this file.

---

## [0.3.0] — Infrastructure & Image Analyzers

**Date:** 2026-06-22

**Scope:** Added three new analyzers covering robots.txt, XML sitemaps, and image accessibility. Pipeline expanded from 4 to 7 dimensions.

### Added

- **`src/lib/analyzers/robots.ts`** — `analyzeRobots(pageUrl)`:
  - Derives origin from the final page URL, fetches `/robots.txt`
  - 5-second timeout; 404/fetch failure treated as "not found" (non-fatal)
  - Parses `User-agent` and `Sitemap` directives from each line
  - Scoring: exists (40) + has directives (30) + has sitemap refs (30) = 100

- **`src/lib/analyzers/sitemap.ts`** — `analyzeSitemap(pageUrl, robotsSitemapUrls?)`:
  - Tries sitemap URLs from robots.txt first, falls back to `/sitemap.xml`
  - Validates XML structure; counts `<url>` or `<sitemap>` elements via regex
  - Handles both `<urlset>` and `<sitemapindex>` formats
  - Scoring: exists (40) + valid XML (0) + has URL entries (60) = 100

- **`src/lib/analyzers/images.ts`** — `analyzeImages(html)`:
  - Counts all `<img>` elements and checks for non-empty alt attributes
  - Empty or whitespace-only alt treated as missing
  - Coverage = (withAlt / total) × 100; score = coverage percentage
  - Edge case: zero images → score 100 (no violations)

### Changed

- **`src/types/analysis.ts`** — Added `RobotsResult`, `SitemapResult`, `ImageAccessibilityResult` (all extend `AnalyzerResult`)
- **`src/types/api.ts`** — `BasicAnalyzeResponse` extended with: `robotsScore`, `sitemapScore`, `imageAccessibilityScore`, `robotsData`, `sitemapData`, `imageData`
- **`src/app/api/analyze/route.ts`** — Pipeline now runs 7 analyzers. HTML-based ones (SEO, heading, semantic, structured data, images) run in sequence; external-resource ones (robots, sitemap) run via fetch. Overall score = average of 7 dimensions.
- **`src/components/results-dashboard.tsx`** — 7-dimension badge grid; new sections for image accessibility (total/with/without/coverage), robots.txt (existence, directives, sitemap refs), and sitemap (existence, URL count).

### Architecture

- External fetchers (robots, sitemap) use the same AbortController pattern as `fetchHtml` with 5s timeouts
- Errors from auxiliary fetchers never crash the pipeline — they return zero-score results with explanatory findings
- Sitemap analyzer accepts optional sitemap URLs from robots.txt for correct discovery order

---

## [0.2.0] — Multi-Dimensional Analysis Engine

**Date:** 2026-06-22

**Scope:** Extended the vertical slice with three new deterministic analyzers and multi-dimensional scoring.

### Added

- **`src/lib/analyzers/structure.ts`** — Two analyzers:
  - `analyzeHeadingHierarchy()` — counts H1/H2/H3, detects missing H1, multiple H1, H3 without H2, H2 without H1. Returns 0–100 score.
  - `analyzeSemanticHtml()` — checks for `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`. Score = (detected / 6) × 100.
- **`src/lib/analyzers/discoverability.ts`** — `analyzeStructuredData()`:
  - Finds `<script type="application/ld+json">` blocks
  - Parses JSON-LD and recognizes: Organization, FAQPage, Article, Product, LocalBusiness
  - Handles `@graph` arrays and `@type` arrays
  - Base score 50 for any JSON-LD, +15 per recognized type, max 100
  - Catches invalid JSON gracefully

### Changed

- **`src/lib/analyzers/seo.ts`** — Refactored:
  - `extractBasicPageData()` / `computeBasicScore()` replaced by single `analyzeSeo()`
  - H1 checks moved to heading hierarchy analyzer
  - SEO now scores title presence + length (max 50) and meta description presence + length (max 50) for a 0–100 dimension score
  - Meta extraction changed from `.each()` to `.filter().first()` to avoid TypeScript narrowing issue

- **`src/types/analysis.ts`** — Added shared `AnalyzerResult` interface; new result types: `HeadingHierarchyResult`, `SemanticHtmlResult`, `StructuredDataResult`. `SeoResult` now extends `AnalyzerResult`.

- **`src/types/api.ts`** — `BasicAnalyzeResponse` extended with: `h2Count`, `h3Count`, `seoScore`, `headingHierarchyScore`, `semanticHtmlScore`, `structuredDataScore`, `semanticElements`, `detectedSchemas`.

- **`src/app/api/analyze/route.ts`** — Pipeline now runs 4 analyzers (SEO → Heading Hierarchy → Semantic HTML → Structured Data). Overall score = average of all 4 dimension scores. Response includes per-dimension scores and structured data.

- **`src/components/results-dashboard.tsx`** — Redesigned with:
  - 2×2 grid of `DimensionBadge` cards showing per-dimension scores
  - H1/H2/H3 count display
  - Semantic HTML element badges (green=present, red=missing, struck-through)
  - Structured data schema badges

### Architecture

- All analyzers are deterministic, Cheerio-based, and independently testable
- Each analyzer produces a 0–100 score + typed findings
- Pipeline averages 4 dimension scores for the overall score
- Forward-compatible: adding PageSpeed or Gemini later is just adding more analyzers to the average

---

## [0.1.0] — Vertical Slice

**Date:** 2026-06-22

**Scope:** Minimum viable URL analysis pipeline — synchronous, no database, no external APIs.

### Architecture Implemented

- **`src/lib/validators/url.ts`** — URL validation (format, protocol, hostname). Shared between client and server. Auto-prepends `https://`.
- **`src/lib/html/fetcher.ts`** — Server-side HTML fetcher. Single GET with 15s `AbortController` timeout, `Content-Type` validation, 200KB truncation. Error types: timeout, DNS, non-200, non-HTML.
- **`src/lib/analyzers/seo.ts`** — Cheerio-based DOM parser. Extracts `<title>`, `<h1>` count, `<meta name="description">`. `computeBasicScore()` applies 6 rule-based checks mapped to 0–100.
- **`src/app/api/analyze/route.ts`** — Synchronous `POST /api/analyze`. Validates → fetches → extracts → scores → returns JSON. Uses `AnalysisError` hierarchy for proper HTTP status codes (400/502/504/500).
- **`src/app/page.tsx`** — Client component with state machine: `idle → loading → results | error`. Single-page flow (no redirect).
- **`src/app/layout.tsx`** — Root layout with Inter font, metadata, Tailwind base.
- **`src/components/`** — UI layer: `Input`, `Button` (primitives), `AnalysisForm` (URL input + validation), `ResultsDashboard` (score hero + extracted data + findings list).
- **`src/types/`** — Full type contracts defined (ahead of implementation): `Dimension`, `Analysis`, `PageData`, `CoreWebVitals`, `AiAnalysis`, `Finding`, `Recommendation`, per-analyzer result types.
- **`src/config/`** — `constants.ts` with score weights, grade thresholds, timeouts, size limits. `prompts.ts` with Gemini prompt builder (unused until Gemini integration).

### Tech Stack (current)

| Component | Status |
|---|---|
| Next.js 15 (App Router) | ✓ |
| TypeScript | ✓ |
| Tailwind CSS v4 | ✓ |
| Cheerio (DOM parser) | ✓ |
| Supabase | ❌ (stub) |
| PageSpeed Insights API | ❌ (stub) |
| Gemini Flash API | ❌ (stub) |

### Key Decisions

- **Cheerio over regex** — DOM-based parsing for maintainability and future extensibility to heading hierarchy, accessibility, structured data.
- **Single GET over HEAD+GET** — Avoids false negatives from HEAD-blocking servers. Reachability is proven by successful HTML retrieval.
- **Synchronous over async** — No database yet. Results returned inline on the landing page instead of polling.
- **Stub files preserved** — Future analyzer and integration files exist as stubs (`export {}`) to maintain the architectural skeleton without breaking the build.

### Covered Requirements

- URL input + submission
- URL validation (client + server)
- HTML fetching with timeout/error handling
- DOM-based extraction (title, h1, meta description)
- Rule-based scoring (0–100 with findings)
- Results display with pass/fail breakdown
- Error handling with typed error classes

### Missing (Next Priorities)

- PageSpeed Insights integration (performance dimension)
- Structure analyzer (heading hierarchy, semantic HTML)
- Accessibility analyzer (alt text, ARIA, lang)
- AI Discoverability analyzer (structured data, sitemap)
- Gemini Flash AI-readiness assessment
- Weighted multi-dimensional scoring
- Supabase persistence + async pipeline
- Analysis history

### Architecture Documents

- `docs/architecture.md` — Full system architecture, schema, API flow, risks
- `docs/roadmap.md` — Phased delivery plan (5 phases, ~25 days)
- `docs/folder-structure.md` — Per-file rationale, responsibility, data flow
