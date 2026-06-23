# AI Readiness Analyzer — Folder Structure & Design Rationale

> **Scope:** MVP only  
> **Audience:** Engineering review (CTO / Tech Lead)  
> **Principle:** Every file exists for exactly one reason. No dead code, no premature abstraction.

---

## Root Configuration Files

### `.env.local` / `.env.example`

| Aspect | Detail |
|---|---|
| **Why it exists** | All secrets (API keys, Supabase credentials) must be externalized from code. `.env.example` documents the shape for other developers; `.env.local` is git-ignored. |
| **Responsibility** | Single source of truth for environment-dependent configuration. Validated at startup in `config/index.ts`. |
| **Data flow** | Values are read by `config/index.ts` and distributed to `lib/api/*`, `lib/supabase/*`. Never passed to the client. |

**Expected keys:**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_PSI_API_KEY=
GEMINI_API_KEY=
```

### `next.config.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Next.js build-time configuration: image domains, redirects, headers, experimental features. |
| **Responsibility** | Declares that external image sources (for OG previews) are allowed; configures any security headers (CSP, HSTS) for production. |
| **Data flow** | Build-time only. No runtime data. |

### `tailwind.config.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Custom design tokens (score colors: red/orange/yellow/green, spacing, typography) shared across all components. |
| **Responsibility** | Defines the theme that every component references via utility classes. |
| **Data flow** | Design-time only. Compiled into CSS by PostCSS. |

### `tsconfig.json` / `package.json` / `eslint.config.mjs` / `postcss.config.mjs`

Standard tooling configuration. `package.json` declares scripts:

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:migrate": "supabase migration up",
    "db:types": "supabase gen types typescript --local > src/types/supabase.ts"
  }
}
```

---

## `public/`

### `public/images/`

| Aspect | Detail |
|---|---|
| **Why it exists** | Static assets served at the root path without hashing. |
| **Responsibility** | Holds the Open Graph preview image and favicon. |
| **Data flow** | Referenced by `layout.tsx` metadata. No runtime data. |

---

## `supabase/`

### `supabase/migrations/00001_initial_schema.sql`

| Aspect | Detail |
|---|---|
| **Why it exists** | Every database change must be version-controlled, repeatable, and reviewable. A single migration covers the MVP schema. |
| **Responsibility** | Defines all four tables (`analyses`, `page_data`, `core_web_vitals`, `ai_analysis`), indexes, foreign keys, and RLS policies (disabled for MVP). |
| **Data flow** | Applied via `supabase migration up`. Read by `lib/supabase/server.ts` at query time. |

### `supabase/config.toml`

| Aspect | Detail |
|---|---|
| **Why it exists** | Supabase CLI configuration: project ID, database settings, auth providers. |
| **Responsibility** | Tracks local Supabase settings for team reproducibility. |

---

## `src/app/` — Next.js App Router

This directory **is the routing layer**. It owns request/response I/O. No business logic lives here.

### `src/app/layout.tsx`

| Aspect | Detail |
|---|---|
| **Why it exists** | Required by App Router. Wraps every page with shared HTML shell, fonts, metadata, and React providers. |
| **Responsibility** | Sets `<html lang="en">`, imports Inter font (via next/font), defines global `<head>` metadata (title, description, OG), and wraps children in any providers (none for MVP). |
| **Data flow** | No props. Receives React children and renders them within shared markup. |

### `src/app/globals.css`

| Aspect | Detail |
|---|---|
| **Why it exists** | Tailwind directives (`@tailwind base/components/utilities`) plus any global base styles. |
| **Responsibility** | Imports Tailwind layers and defines CSS custom properties for score colors. |
| **Data flow** | Static. Imported by `layout.tsx`. |

### `src/app/page.tsx` — Landing Page

| Aspect | Detail |
|---|---|
| **Why it exists** | Root route `/`. The single entry point for URL submission. |
| **Responsibility** | Renders `AnalysisForm` and, below it, a visual call-to-action. On form submit, calls `POST /api/analyze` and redirects to `/results/[id]`. |
| **Data flow** | **Input:** user-entered URL. **Output:** `{ analysisId }` from the API → `router.push(/results/${id})`. |

### `src/app/loading.tsx` — Global Loading

| Aspect | Detail |
|---|---|
| **Why it exists** | App Router convention. Rendered during page transitions for the landing page. |
| **Responsibility** | Shows a centered spinner or skeleton while the landing page chunk loads. |
| **Data flow** | None. Presentational only. |

### `src/app/error.tsx` — Global Error Boundary

| Aspect | Detail |
|---|---|
| **Why it exists** | App Router convention. Catches unhandled errors in any page below the root layout. |
| **Responsibility** | Displays a friendly error message with a "Try again" button. Logs the error context to the console for debugging. |
| **Data flow** | Receives `error` and `reset` from Next.js. No data flow beyond the boundary. |

---

## `src/app/api/` — Route Handlers (Server-Side)

Each file exports typed `GET`/`POST`/etc. functions. All external-service calls, HTML parsing, and database writes happen here or in functions called from here.

### `src/app/api/analyze/route.ts` — `POST /api/analyze`

| Aspect | Detail |
|---|---|
| **Why it exists** | Public API for initiating an analysis. Called by the landing page form. |
| **Responsibility** | Validates the URL (format + reachability), inserts a row into `analyses` with `status: 'pending'`, launches the analysis pipeline (async), and returns `{ analysisId }` immediately (HTTP 202). The client polls for completion. |
| **Data flow** | **Request body:** `{ url: string }`. **Validation:** `lib/validators/url.ts`. **DB write:** inserts into `analyses`. **Response:** `{ analysisId: string }`. |

### `src/app/api/analyze/[id]/route.ts` — `GET /api/analyze/[id]`

| Aspect | Detail |
|---|---|
| **Why it exists** | Lightweight polling endpoint so the client can check whether analysis is complete. |
| **Responsibility** | Reads `analyses.status` and `analyses.overall_score` for the given ID. Returns `{ status, overallScore }` (or `null` if not found). |
| **Data flow** | **URL param:** `id`. **DB read:** single-row select on `analyses`. **Response:** `{ status: 'pending'|'running'|'completed'|'failed', overallScore?: number }`. |

### `src/app/api/results/[id]/route.ts` — `GET /api/results/[id]`

| Aspect | Detail |
|---|---|
| **Why it exists** | Returns the full analysis once complete. Called by the results dashboard page. |
| **Responsibility** | Joins `analyses` with `page_data`, `core_web_vitals`, and `ai_analysis`. Returns a denormalized JSON payload with all scores, findings, and recommendations. |
| **Data flow** | **URL param:** `id`. **DB read:** multi-table join. **Response:** full `AnalysisResult` type (see `types/api.ts`). |

### `src/app/api/history/route.ts` — `GET /api/history`

| Aspect | Detail |
|---|---|
| **Why it exists** | Returns recent analyses for the history view. |
| **Responsibility** | Queries `analyses` ordered by `created_at DESC`, limited to 20 rows. Returns minimal data per row (id, url, overall_score, created_at). |
| **Data flow** | **DB read:** `SELECT id, url, overall_score, created_at FROM analyses ORDER BY created_at DESC LIMIT 20`. **Response:** `{ analyses: [...], total: number }`. |

---

## `src/app/results/[id]/` — Results Dashboard Page

### `src/app/results/[id]/page.tsx`

| Aspect | Detail |
|---|---|
| **Why it exists** | Route `/results/[id]`. The primary deliverable — displays the full analysis. |
| **Responsibility** | Fetches data from `/api/results/[id]` via server component fetch (or client `useEffect` if polling). Renders `OverallScoreHero`, `ScoreCard` × 6, `FindingList` × 6, and `RecommendationList`. |
| **Data flow** | **Input:** URL param `id`. **Fetch:** `GET /api/results/[id]`. **Render:** passes data down to child components. |

### `src/app/results/[id]/loading.tsx`

| Aspect | Detail |
|---|---|
| **Why it exists** | Shown while the results page data is loading (server fetch pending). |
| **Responsibility** | Renders a 6-card skeleton grid matching the layout of the real dashboard, so the user sees a consistent structure. |
| **Data flow** | None. Presentational only. |

### `src/app/results/[id]/error.tsx`

| Aspect | Detail |
|---|---|
| **Why it exists** | Catches fetch errors or missing-analysis errors for this route only. |
| **Responsibility** | Shows "Analysis not found" or "Failed to load results" with a retry action. |
| **Data flow** | Receives `error` from Next.js boundary. No downstream data flow. |

---

## `src/components/` — React Components

This directory is the **UI layer**. Components receive typed props and render HTML. They never call APIs directly, never access the database, and never import server-only modules.

### `src/components/ui/` — Primitives

A set of unstyled/lightly-styled primitive components. These are the building blocks for all page-level components.

| File | Why It Exists | Responsibility | Data Flow |
|---|---|---|---|
| `button.tsx` | Reusable button primitive | Renders `<button>` with variants (primary, secondary, ghost, danger). Accepts `onClick`, `disabled`, `loading` (shows spinner). | Props: `children`, `variant`, `loading`, `onClick`. |
| `card.tsx` | Visual container for score sections | Renders a rounded, shadowed `<div>` with optional header/footer slots. | Props: `title?`, `children`, `className?`. |
| `input.tsx` | URL input field | Renders `<input>` with label, error state, and debounced validation indicator. | Props: `value`, `onChange`, `error?`. |
| `badge.tsx` | Score grade and priority badges | Renders a small colored pill (e.g., "High Priority", "A", "Needs Work"). | Props: `variant: 'success'\|'warning'\|'error'\|'info'`, `children`. |
| `skeleton.tsx` | Loading placeholders | Renders an animated gray rectangle/circle. Used by loading.tsx files. | Props: `width`, `height`, `rounded`. |

### `src/components/analysis-form.tsx`

| Aspect | Detail |
|---|---|
| **Why it exists** | The primary interaction on the landing page. Users type a URL and submit. |
| **Responsibility** | Manages `url` state with debounced client-side validation. On submit: POST to `/api/analyze`, get `analysisId`, navigate to `/results/[id]`. Shows inline error for invalid/unreachable URLs. |
| **Data flow** | **Input:** user keystrokes → local state. **Output:** `fetch(POST /api/analyze)` → `router.push()`. **External influence:** receives nothing from parent (self-contained). |

### `src/components/results-dashboard.tsx`

| Aspect | Detail |
|---|---|
| **Why it exists** | Orchestrates the entire results view. Called by the page component. |
| **Responsibility** | Arranges `OverallScoreHero` at top, then a 2×3 or 3×2 grid of `ScoreCard` components, then `FindingList` and `RecommendationList` sections. |
| **Data flow** | **Input:** `AnalysisResult` (full analysis data). **Output:** renders child components, slicing the data per dimension. No output events. |

### `src/components/overall-score-hero.tsx`

| Aspect | Detail |
|---|---|
| **Why it exists** | The first thing users see on the results page — a prominent overall grade. |
| **Responsibility** | Renders a large circular gauge (0–100) with a letter grade (A: 90+, B: 75+, C: 60+, D: 45+, F: <45). Color-coded green→red. |
| **Data flow** | **Input:** `score: number`, `url: string`. **Output:** none. |

### `src/components/score-gauge.tsx`

| Aspect | Detail |
|---|---|
| **Why it exists** | Reusable circular/radial gauge used inside every ScoreCard and the hero. |
| **Responsibility** | Renders an SVG circle with a `stroke-dashoffset` animation. Color transitions: green (>80), yellow (60–80), orange (40–60), red (<40). |
| **Data flow** | **Input:** `score: number`, `size: 'sm'|'lg'`. **Output:** none. |

### `src/components/score-card.tsx`

| Aspect | Detail |
|---|---|
| **Why it exists** | One per dimension (×6). Consistent visual unit for presenting a score. |
| **Responsibility** | Shows: dimension name, `ScoreGauge`, score number, grade, and the single most important finding (pass/fail headline). |
| **Data flow** | **Input:** `dimension: Dimension`, `score: number`, `headlineFinding: string`. **Output:** none. |

### `src/components/finding-list.tsx`

| Aspect | Detail |
|---|---|
| **Why it exists** | Collapsible detail list for each dimension's pass/fail items. |
| **Responsibility** | Renders a list of findings, each with a checkmark (passed) or x-icon (failed). Grouped by category. Default collapsed for large lists. |
| **Data flow** | **Input:** `findings: Finding[]` (array of `{ category, passed, description }`). **Output:** toggle collapse — internal state only. |

### `src/components/recommendation-list.tsx`

| Aspect | Detail |
|---|---|
| **Why it exists** | AI-generated recommendations are a key differentiator. This displays them clearly. |
| **Responsibility** | Renders a priority-sorted (High → Medium → Low) list of actionable recommendations from the Gemini analysis. Each item has a `Badge` for priority, a description, and the affected dimension. |
| **Data flow** | **Input:** `recommendations: Recommendation[]`. **Output:** none. |

### `src/components/history-list.tsx`

| Aspect | Detail |
|---|---|
| **Why it exists** | Lists past analyses on the history page. |
| **Responsibility** | Fetches from `/api/history` on mount (client component). Renders a table/card list with URL, date, and overall score. Click navigates to `/results/[id]`. |
| **Data flow** | **Input:** none (self-fetches). **Output:** `fetch(GET /api/history)` → renders rows → `router.push(/results/${id})`. |

---

## `src/lib/` — Application Logic (No JSX)

This is the **core of the application**. Every function here is a pure or nearly-pure function that takes data in and returns data out. No React, no routing, no side effects except explicit I/O (DB, HTTP).

### `src/lib/supabase/` — Database Access Layer

#### `client.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Browser-side Supabase client needs the anon key (safe to expose) to query Row-Level-Security-protected tables. For MVP without auth, it's used minimally. |
| **Responsibility** | Creates and exports a singleton Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Uses `@supabase/ssr` for cookie-based session handling. |
| **Data flow** | **Input:** env vars. **Output:** `supabase` client instance used in client components that need direct DB reads (e.g., history). |

#### `server.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Server-side Supabase client with the service-role key. Bypasses RLS — only used in API route handlers. |
| **Responsibility** | Creates a Supabase admin client using `SUPABASE_SERVICE_ROLE_KEY`. Must never be imported by client components. |
| **Data flow** | **Input:** env vars. **Output:** `supabaseAdmin` client instance used in `/api/*` route handlers. |

#### `queries.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Centralizes all database queries so they're typed, reviewable, and reusable across handlers. |
| **Responsibility** | Exports functions like `createAnalysis(url)`, `getAnalysisStatus(id)`, `getFullResults(id)`, `listRecentAnalyses()`. Each function uses the server client, builds a typed query, and returns typed results. |
| **Data flow** | **Input:** parameters (url, id, etc.). **Internal:** uses `server.ts` client. **Output:** typed rows or row collections. |

### `src/lib/analyzers/` — Analysis Rule Engines

Each analyzer is a function that receives parsed HTML + headers and returns a typed result structure. They are **deterministic** — same input always produces same output.

#### `seo.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | SEO is a core analysis dimension. Must be rule-based and deterministic — no AI dependency. |
| **Responsibility** | Parses the extracted meta tags and checks: `<title>` exists and is <60 chars, `<meta name="description">` exists and is <160 chars, OG tags present (title, description, image, type), Twitter card tags present, canonical URL present, robots meta present, `hreflang` present if multi-language. Returns `{ passed: number, failed: number, findings: Finding[] }`. |
| **Data flow** | **Input:** `{ title, metaDescription, ogData, twitterData, canonical, robots, hreflang }`. **Output:** `SeoResult`. |

#### `structure.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Semantic HTML structure affects both accessibility and AI parsability. |
| **Responsibility** | Analyzes heading hierarchy: exactly one `<h1>`, no skipped levels (h1→h3 without h2). Counts semantic elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`). Returns findings like "Missing `<main>` landmark" or "Skipped heading level from h1 to h3". |
| **Data flow** | **Input:** `{ headings: string[], semanticElements: { element: string, count: number }[] }`. **Output:** `StructureResult`. |

#### `accessibility.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Accessibility is a legal and ethical requirement. Automated checks catch common issues. |
| **Responsibility** | Checks: `<html lang>` attribute set, all `<img>` have `alt` (reports count with and without), ARIA landmark roles present (`role="banner"`, `role="navigation"`, etc.), form inputs associated with `<label>`, color contrast ratio calculation (basic). |
| **Data flow** | **Input:** `{ lang, images: { total, withAlt, withoutAlt }[], ariaRoles: string[], forms: { labelled, unlabelled }[] }`. **Output:** `AccessibilityResult`. |

#### `discoverability.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | AI discoverability is the project's differentiator. Measures how easily an LLM can understand the page. |
| **Responsibility** | Checks: structured data present (JSON-LD, Microdata, RDFa), validates JSON-LD against Schema.org types (Article, Product, FAQ, etc.), checks presence of `<link rel="sitemap">` in HTML or `sitemap.xml` in robots.txt, checks robots.txt allows crawling, checks `X-Robots-Tag` header. |
| **Data flow** | **Input:** `{ structuredData: any[], sitemapUrl?: string, robotsTxt?: string, xRobotsTag?: string }`. **Output:** `DiscoverabilityResult`. |

#### `scoring.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Normalizes heterogeneous analyzer outputs into consistent 0–100 scores and computes the weighted overall score. |
| **Responsibility** | Maps each analyzer result to a 0–100 scale using predefined rules. Applies dimension weights from `config/constants.ts`. Returns `{ dimensions: Record<Dimension, number>, overall: number }`. |
| **Data flow** | **Input:** `{ seoResult, structureResult, accessibilityResult, discoverabilityResult, performanceScore, aiReadinessScore }`. **Internal:** weights map. **Output:** `ScoredAnalysis`. |

#### `pipeline.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Single orchestrator that runs the entire analysis in sequence. Keeps route handlers clean. |
| **Responsibility** | Calls each analyzer in order, handles errors per-analyzer (allows partial failures), fetches HTML, calls external APIs, writes results to Supabase, updates `analyses.status` at each phase. |
| **Data flow** | **Input:** `url: string`. **Internal:** orchestrates `fetcher → seo → structure → a11y → discoverability → pagespeed → gemini → scoring → supabase` writes. **Output:** completes when all data is persisted. Throws structured errors for the route handler to catch. |

### `src/lib/api/` — External API Clients

#### `pagespeed.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Encapsulates Google PageSpeed Insights API interaction behind a typed function. |
| **Responsibility** | Fetches `GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=...&key=...`. Parses the Lighthouse result for `lcp`, `fid`, `inp`, `cls`, and `performance_score`. Includes retry logic (exponential backoff, max 3 retries) and timeout (10s). Returns typed result or throws. |
| **Data flow** | **Input:** `url: string`. **Internal:** HTTP fetch with `GOOGLE_PSI_API_KEY`. **Output:** `{ lcp, fid, inp, cls, performanceScore, rawResponse }`. |

#### `gemini.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Encapsulates Gemini Flash API interaction behind a typed function. |
| **Responsibility** | Builds a structured prompt (from `config/prompts.ts`) containing the aggregated page data, sends to Gemini with `response_mime_type: "application/json"`, parses the JSON response, validates it matches the expected schema, and returns structured AI analysis. |
| **Data flow** | **Input:** `{ url, seoResult, structureResult, accessibilityResult, discoverabilityResult, performanceData }`. **Internal:** HTTP POST to Gemini API with `GEMINI_API_KEY`, constructs full prompt. **Output:** `{ summary, recommendations, strengths, weaknesses, aiReadinessScore }`. |

### `src/lib/html/fetcher.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Fetching arbitrary URLs from a server environment has many edge cases (timeouts, redirects, non-HTML responses, large payloads). This file contains all that complexity. |
| **Responsibility** | Fetches the target URL with a 15-second timeout. Follows up to 5 redirects. Validates `Content-Type` is `text/html`. Truncates response body to 200KB. Returns `{ html, headers, finalUrl, statusCode }`. |
| **Data flow** | **Input:** `url: string`. **Output:** `FetchedPage` (validated HTML + metadata). **Throws:** on timeout, non-200, non-HTML, DNS failure. |

### `src/lib/validators/url.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | URL validation must happen on both client (UX) and server (security). This file is a shared function. |
| **Responsibility** | Validates: string is a valid URL, protocol is `http` or `https`, no IPFS/onion/`localhost` (unless dev mode), hostname has at least one dot (not `http://foo`). Also performs a lightweight reachability check (HEAD request to verify the server responds). |
| **Data flow** | **Input:** `rawUrl: string`. **Output:** `{ valid: true, url: string } | { valid: false, error: string }`. |

### `src/lib/utils/logger.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Structured logging is critical for debugging in serverless environments where you can't attach a debugger. |
| **Responsibility** | Provides `log.info(module, message, data?)`, `log.warn(...)`, `log.error(...)`. Each call produces a JSON line with timestamp, module name, message, and optional structured data. In development, pretty-prints to console. |
| **Data flow** | **Input:** log level + message + data. **Output:** writes to `stdout`/`stderr`. No return value. |

### `src/lib/utils/errors.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Custom error classes let the pipeline distinguish between retryable failures (API timeout) and non-retryable ones (invalid URL), and let the API layer return appropriate HTTP status codes. |
| **Responsibility** | Exports: `AnalysisError` (base), `UrlValidationError`, `HtmlFetchError`, `ApiRateLimitError`, `ApiTimeoutError`, `GeminiParseError`, `PartialAnalysisError`. Each carries a `statusCode` and `userMessage`. |
| **Data flow** | **Usage:** thrown by `lib/*` functions, caught by route handlers. **Output:** serialized to `{ error: string, code: string }` in API responses. |

---

## `src/types/` — TypeScript Type Definitions

This directory is the **contract layer**. Every function signature, API response shape, and database row has a corresponding type here.

### `src/types/analysis.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Central type definitions for all analysis-related data structures. |
| **Responsibility** | Defines `Analysis` (row shape), `PageData`, `CoreWebVitals`, `AiAnalysis`, `Finding`, `Dimension` (union of 6 strings), `Recommendation`, `AnalysisStatus`, `SeoResult`, `StructureResult`, `AccessibilityResult`, `DiscoverabilityResult`. |
| **Key types** | `Dimension = 'ai-readiness' | 'seo' | 'structure' | 'accessibility' | 'performance' | 'discoverability'` |

### `src/types/scores.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Score-related types separate from analysis data for clarity. |
| **Responsibility** | Defines `ScoredDimension` (dimension + score + grade), `OverallScore` (total + grade + breakdown), `Grade` (`'A'|'B'|'C'|'D'|'F'`). |
| **Data flow** | Used by `scoring.ts` (producer) and `ScoreCard`/`ScoreGauge` (consumers). |

### `src/types/api.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Every API endpoint has a request/response contract. These types enforce it. |
| **Responsibility** | Defines `AnalyzeRequest`, `AnalyzeResponse`, `AnalyzeStatusResponse`, `FullResultsResponse`, `HistoryResponse`. Used by both route handlers and client-side fetch calls. |
| **Key types** | `FullResultsResponse = Analysis & { pageData: PageData, coreWebVitals: CoreWebVitals, aiAnalysis: AiAnalysis }` |

### `src/types/supabase.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Generated by `supabase gen types`. Mirrors the live database schema as TypeScript types. |
| **Responsibility** | Provides `Database` type that `server.ts` and `client.ts` use to type their queries. Re-generated when schema changes. |
| **Data flow** | Auto-generated. Imported by `queries.ts` and route handlers. |

### `src/types/gemini.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Gemini response schema needs its own types distinct from internal analysis types. |
| **Responsibility** | Defines `GeminiResponse` (the expected JSON shape from the LLM) and `GeminiRequest` (the prompt + config sent to the API). Used to validate the LLM output at runtime. |

---

## `src/config/` — Application Configuration

### `config/index.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Single entry point for all configuration. Validates that required env vars are present at startup. |
| **Responsibility** | Exports: `env` (validated env vars), `limits` (from constants), `weights` (from constants), `prompts` (from prompts). Throws on missing required env vars in production. |

### `config/constants.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | Magic numbers should have names. This file collects all tunable parameters. |
| **Responsibility** | Exports: `SCORE_WEIGHTS` (Record<Dimension, number>), `HTML_FETCH_TIMEOUT_MS`, `HTML_MAX_BYTES`, `PAGESPEED_TIMEOUT_MS`, `GEMINI_TIMEOUT_MS`, `MAX_RETRIES`, `GRADE_THRESHOLDS`, `HISTORY_LIMIT`, `RECENT_DAYS_TTL`. |

### `config/prompts.ts`

| Aspect | Detail |
|---|---|
| **Why it exists** | The Gemini prompt is the most iterated piece of text in the project. Separating it from code makes iteration safe. |
| **Responsibility** | Exports the system prompt for Gemini that instructs it to: evaluate AI-readiness, produce structured JSON output, assign a score 0–100, list strengths, weaknesses, and prioritized recommendations. The prompt includes the aggregated page data as context. |

---

## Data Flow Summary (End-to-End)

```
User types URL
       │
       ▼
analysis-form.tsx ──validates──> POST /api/analyze ──> url.ts (validate)
       │                                                   │
       │                                                   ▼
       │                                             pipeline.ts ──> fetcher.ts (HTML)
       │                                                              │
       │                                              ┌───────────────┤
       │                                              ▼               ▼
       │                                         seo.ts        structure.ts
       │                                         a11y.ts    discoverability.ts
       │                                              │               │
       │                                              ▼               ▼
       │                                         pagespeed.ts ──> gemini.ts
       │                                                              │
       │                                              ┌───────────────┤
       │                                              ▼               ▼
       │                                         scoring.ts     queries.ts (write)
       │                                                              │
       │                                              ┌───────────────┤
       │                                              ▼
       │                                   Supabase (analyses + child tables)
       │                                              │
       │                     ┌────────────────────────┤
       │                     ▼                        ▼
       │        GET /api/results/:id          GET /api/history
       │                     │                        │
       ▼                     ▼                        ▼
results/[id]/page.tsx   queries.ts (read)    history-list.tsx (fetch)
       │                     │                        │
       ▼                     ▼                        ▼
results-dashboard.tsx   Full JSON response      History list rendered
       │
       ├── overall-score-hero.tsx
       ├── score-card.tsx × 6 (each with score-gauge.tsx)
       ├── finding-list.tsx × 6
       └── recommendation-list.tsx
```

---

## Key Architectural Decisions (for CTO Review)

| Decision | Rationale | Trade-off |
|---|---|---|
| **Sequential pipeline** | Simplicity. Each analyzer depends on the HTML fetcher; Gemini depends on aggregated data. | Cannot parallelize all analyzers. Future optimization: run SEO/structure/a11y/discoverability in parallel after HTML fetch. |
| **Polling, not WebSocket** | MVP complexity budget. A 3-second poll interval is acceptable for 10–15 second analysis times. | Slightly higher latency on completion detection. Post-MVP: Server-Sent Events. |
| **No auth in MVP** | Auth adds sign-up friction and session management complexity that distract from the core value proposition. | History is shared (anyone can see any analysis by ID). Post-MVP: Supabase Auth + RLS. |
| **Service-role key for server** | Avoids RLS overhead during analysis writes. The anon key only sees public data. | Requires careful env var protection. Never expose service-role key to client. |
| **HTML truncation at 200KB** | Prevents memory exhaustion on large pages and keeps Gemini prompts small. | May miss late-page content (below-fold structured data). Documented limitation. |
| **Gemini JSON mode** | Eliminates prompt-engineering guesswork for output parsing. | Slightly higher latency; requires exact schema alignment between prompt and types. |
| **No ORM** | Supabase JS client is already typed and handles the simple relational model well. Prisma/Kysely would add dependency weight without significant benefit. | Raw SQL in migrations + typed queries in `queries.ts` is sufficient for 4 tables. |
