# AI Readiness Analyzer — Architecture

## 1. System Overview

The AI Readiness Analyzer accepts a URL, fetches the page, and evaluates it across six dimensions:

| Dimension | Source | What It Measures |
|---|---|---|
| AI Readiness | Google Gemini Flash | LLM-friendliness, semantic clarity, entity extraction |
| SEO | Custom analysis (server-side) | Meta tags, Open Graph, Twitter cards, robots, canonical |
| Structure | Custom analysis (server-side) | Heading hierarchy, semantic HTML5 elements, landmarks |
| Accessibility | Custom analysis (server-side) | Alt text, ARIA attributes, contrast ratios, focus order |
| Core Web Vitals | Google PageSpeed Insights API | LCP, FID/INP, CLS, Performance score |
| AI Discoverability | Gemini + Custom analysis | Structured data (JSON-LD, Microdata), sitemap presence, robots.txt |

Scores are aggregated into an **overall AI-readiness score** (0–100) displayed on a results dashboard.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│  Next.js App Router — Tailwind CSS — TypeScript          │
│  Pages: Landing, Results/[id], History                   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (JSON)
                       ▼
┌─────────────────────────────────────────────────────────┐
│               Next.js Route Handlers (API)               │
│  /api/analyze ──── orchestrates the full pipeline        │
│  /api/results/[id] ── returns stored analysis            │
└──────┬──────────────────────────────┬───────────────────┘
       │                              │
       ▼                              ▼
┌──────────────┐            ┌──────────────────┐
│  PageSpeed   │            │   Gemini Flash   │
│  Insights    │            │   (LLM review)   │
│  API         │            │                  │
└──────────────┘            └──────────────────┘
       │                              │
       └──────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│               Supabase (PostgreSQL)                      │
│  analyses, page_data, core_web_vitals, ai_analysis       │
└─────────────────────────────────────────────────────────┘
```

**Key principle:** All external API calls and HTML parsing happen server-side via Next.js Route Handlers. The client only receives computed scores and structured data — no raw API keys or fetched HTML are exposed.

---

## 3. Component Breakdown

### 3.1 Client-Side (src/app + src/components)

| Component | Responsibility |
|---|---|
| `LandingPage` | URL input form, validation, submit action, redirect to results |
| `ResultsDashboard` | Tabbed/card layout showing all six dimension scores + overall |
| `ScoreCard` | Single dimension with gauge/bar, score, key findings |
| `AnalysisForm` | Controlled input with debounced UX validation |
| `HistoryPage` | Paginated list of past analyses with search/filter |
| `ReportExport` | Generate downloadable PDF summary |

### 3.2 API Layer (src/app/api)

| Route Handler | Method | Responsibility |
|---|---|---|
| `/api/analyze` | `POST` | Validate URL, create analysis row (status=pending), kick off analysis pipeline (can be async or await), return `{ analysisId }` |
| `/api/analyze/[id]` | `GET` | Return current analysis status + results (for polling) |
| `/api/results/[id]` | `GET` | Return full results data for the dashboard |
| `/api/history` | `GET` | Return paginated user analysis history |

### 3.3 Analysis Pipeline (src/lib/analyzers)

The pipeline runs **sequentially** because some stages depend on earlier data:

```
1. URL Validation         → ensure reachable, HTTP 200, HTML content-type
2. Fetch HTML             → fetch raw HTML + headers
3. SEO Analysis           → parse <title>, <meta>, OG, Twitter, canonical, robots
4. Structure Analysis     → parse heading outline, <header>, <nav>, <main>, <article>, <aside>, <footer>
5. Accessibility Analysis → check alt attributes, aria-*, lang, role, focusable
6. PageSpeed API Call     → fetch LCP, FID/INP, CLS, performance score
7. Gemini AI Analysis     → send aggregated data with structured prompt, receive readiness assessment
8. Score Aggregation      → normalize each dimension to 0–100, compute weighted overall
9. Persist Results        → upsert into Supabase
```

### 3.4 Scoring Model

| Dimension | Weight | Source of Raw Score |
|---|---|---|
| AI Readiness | 25% | Gemini qualitative → mapped to 0–100 |
| SEO | 20% | Rule-based checks (pass/fail per item) |
| Structure | 15% | Heading hierarchy + semantic element count |
| Accessibility | 15% | WCAG rule-based checks |
| Core Web Vitals | 15% | PageSpeed score (0–100 direct) |
| AI Discoverability | 10% | Structured data presence + completeness |

**Overall = weighted average of six dimension scores.**

---

## 4. Database Schema

### 4.1 `analyses`

```sql
CREATE TABLE analyses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url           TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','running','completed','failed')),
  error_message TEXT,

  -- Dimension scores (populated on completion)
  ai_readiness_score       DECIMAL(5,2),
  seo_score                DECIMAL(5,2),
  structure_score          DECIMAL(5,2),
  accessibility_score      DECIMAL(5,2),
  performance_score        DECIMAL(5,2),
  discoverability_score    DECIMAL(5,2),
  overall_score            DECIMAL(5,2),

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_analyses_url ON analyses(url);
```

### 4.2 `page_data`

```sql
CREATE TABLE page_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id     UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,

  title           TEXT,
  meta_description TEXT,
  canonical_url   TEXT,
  robots_directives TEXT,
  og_data         JSONB,
  twitter_data    JSONB,
  structured_data JSONB,       -- array of extracted JSON-LD / microdata
  headings        JSONB,       -- { h1: [...], h2: [...], h3: [...] }
  semantic_elements JSONB,     -- count of <header>, <nav>, <main>, <article>, etc.
  accessibility   JSONB,       -- { img_with_alt, img_without_alt, aria_roles, lang_set }
  tech_indicators JSONB,       -- detected frameworks, SSR/CSR hints
  html_size_bytes INTEGER,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_page_data_analysis ON page_data(analysis_id);
```

### 4.3 `core_web_vitals`

```sql
CREATE TABLE core_web_vitals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id       UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,

  lcp               DECIMAL(8,2),     -- milliseconds
  fid               DECIMAL(8,2),     -- milliseconds (deprecated; INP preferred)
  inp               DECIMAL(8,2),     -- milliseconds (Interaction to Next Paint)
  cls               DECIMAL(8,3),     -- unitless Cumulative Layout Shift
  performance_score DECIMAL(5,2),     -- Lighthouse performance 0–100
  raw_response      JSONB             -- full PageSpeed API response (debugging)
);

CREATE UNIQUE INDEX idx_core_web_vitals_analysis ON core_web_vitals(analysis_id);
```

### 4.4 `ai_analysis`

```sql
CREATE TABLE ai_analysis (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id    UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,

  gemini_model   TEXT NOT NULL,
  prompt_tokens  INTEGER,
  summary        TEXT,                -- 2–3 sentence AI-readiness summary
  recommendations JSONB,              -- array of { category, priority, description }
  strengths      JSONB,               -- array of notable positive findings
  weaknesses     JSONB,               -- array of critical gaps
  raw_response   JSONB                -- full Gemini response for audit
);

CREATE UNIQUE INDEX idx_ai_analysis_analysis ON ai_analysis(analysis_id);
```

### 4.5 Entity Relationship

```
analyses (1) ───→ (1) page_data
analyses (1) ───→ (1) core_web_vitals
analyses (1) ───→ (1) ai_analysis
```

All child tables use `ON DELETE CASCADE` so cleaning up an analysis removes all associated data.

---

## 5. API Data Flow

### 5.1 `POST /api/analyze`

```
Client                     Server                          PageSpeed API      Gemini API        Supabase
  │                          │                                │                  │                  │
  │  POST /api/analyze       │                                │                  │                  │
  │  { url }                 │                                │                  │                  │
  │─────────────────────────>│                                │                  │                  │
  │                          │  Validate URL                  │                  │                  │
  │                          │  Create analysis (pending)     │                  │                  │
  │                          │───────────────────────────────────────────────────────────────────>│
  │                          │                                │                  │                  │
  │                          │  Update status → running       │                  │                  │
  │                          │───────────────────────────────────────────────────────────────────>│
  │                          │                                │                  │                  │
  │  202 { analysisId }      │                                │                  │                  │
  │<─────────────────────────│                                │                  │                  │
  │                          │                                │                  │                  │
  │  [Client polls           │                                │                  │                  │
  │   GET /api/results/id]   │  ─── Analysis Pipeline ────>  │                  │                  │
  │                          │                                │                  │                  │
  │                          │  1. Fetch HTML ──────────────>│(fetch page)       │                  │
  │                          │  2. Run SEO/Structure/A11y    │                  │                  │
  │                          │  3. Request PageSpeed ───────>│                  │                  │
  │                          │  <────────────────────────────│(CWV + score)      │                  │
  │                          │  4. Aggregate & prompt Gemini ──────────────────>│                  │
  │                          │  <───────────────────────────────────────────────│(analysis)        │
  │                          │  5. Compute scores            │                  │                  │
  │                          │  6. Write results             │                  │                  │
  │                          │───────────────────────────────────────────────────────────────────>│
  │                          │  7. Update status → completed │                  │                  │
  │                          │───────────────────────────────────────────────────────────────────>│
```

### 5.2 `GET /api/results/[id]`

```
Client                     Server                          Supabase
  │                          │                                │
  │  GET /api/results/:id    │                                │
  │─────────────────────────>│                                │
  │                          │  SELECT analysis + JOIN all    │
  │                          │  child tables                  │
  │                          │───────────────────────────────>│
  │                          │<───────────────────────────────│
  │  200 { analysis }        │                                │
  │<─────────────────────────│                                │
```

Includes `status` field so the client can show a loading state while `pending`/`running` and render results once `completed`.

---

## 6. Folder Structure

```
ai-readiness/
├── docs/
│   ├── architecture.md
│   └── roadmap.md
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (fonts, metadata, providers)
│   │   ├── page.tsx                # Landing page — URL input
│   │   ├── loading.tsx             # Global suspense fallback
│   │   ├── error.tsx               # Global error boundary
│   │   │
│   │   ├── api/
│   │   │   ├── analyze/
│   │   │   │   ├── route.ts        # POST — start analysis
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts    # GET — poll analysis status
│   │   │   ├── results/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts    # GET — full results
│   │   │   └── history/
│   │   │       └── route.ts        # GET — paginated history
│   │   │
│   │   └── results/
│   │       └── [id]/
│   │           ├── page.tsx        # Results dashboard page
│   │           ├── loading.tsx     # Skeleton/shimmer
│   │           └── error.tsx       # Per-page error boundary
│   │
│   ├── components/
│   │   ├── ui/                     # Primitive components (Button, Card, Input, Badge, etc.)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   └── skeleton.tsx
│   │   ├── analysis-form.tsx       # URL input + submit
│   │   ├── score-card.tsx          # Single dimension gauge/bar
│   │   ├── results-dashboard.tsx   # Full dashboard layout
│   │   ├── score-gauge.tsx         # Circular/radial score visual
│   │   ├── finding-list.tsx        # Bullet list of findings per dimension
│   │   ├── recommendation-list.tsx # Priority-coded recommendations
│   │   ├── page-preview.tsx        # Minimal head/title/meta preview
│   │   └── export-button.tsx       # Trigger PDF export
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser supabase client
│   │   │   ├── server.ts          # Server (service-role) supabase client
│   │   │   └── queries.ts         # Reusable typed query helpers
│   │   ├── analyzers/
│   │   │   ├── seo.ts             # SEO rule-based analyzer
│   │   │   ├── structure.ts       # Semantic HTML structure analyzer
│   │   │   ├── accessibility.ts   # WCAG rule checks
│   │   │   ├── discoverability.ts # Structured data, sitemap, robots analyzer
│   │   │   └── scoring.ts         # Score normalizer + weighted aggregator
│   │   ├── api/
│   │   │   ├── pagespeed.ts       # PageSpeed Insights client (fetch + parse)
│   │   │   └── gemini.ts          # Gemini Flash client (prompt builder + fetch)
│   │   ├── html/
│   │   │   └── fetcher.ts         # Server-side HTML fetcher with timeout
│   │   ├── validators/
│   │   │   └── url.ts             # URL validation + reachability check
│   │   └── utils/
│   │       ├── logger.ts          # Structured logging utility
│   │       └── errors.ts          # Custom error classes
│   │
│   ├── types/
│   │   ├── analysis.ts            # Analysis, PageData, CWV, AIAnalysis types
│   │   ├── scores.ts              # ScoreDimension, OverallScore types
│   │   ├── api.ts                 # Request/response shapes for each endpoint
│   │   └── supabase.ts            # Generated Supabase types (from supabase gen types)
│   │
│   └── config/
│       ├── index.ts               # Exports all config with env validation
│       ├── constants.ts           # Score weights, timeouts, limits
│       └── prompts.ts             # Gemini system prompt + few-shot examples
│
├── supabase/
│   ├── migrations/                # SQL migration files
│   ├── seed.sql                   # Optional seed data
│   └── config.toml                # Supabase CLI configuration
│
├── public/
│   ├── favicon.ico
│   └── images/
│       └── og-image.png
│
├── .env.local                     # Local environment variables (git-ignored)
├── .env.example                   # Documented env template
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── eslint.config.mjs
├── .gitignore
└── README.md
```

---

## 7. Folder Responsibilities

| Folder | Responsibility |
|---|---|
| `src/app` | Next.js App Router pages + API route handlers. Each subfolder maps to a route segment. |
| `src/app/api` | All server-side API endpoints. No business logic here — only request parsing, validation, and delegation to `lib/`. |
| `src/components` | React components. Split into `ui/` for primitives (Button, Card) and top-level for composed widgets. |
| `src/lib` | Pure logic — no JSX. Sub-divided by domain: `analyzers/` for rule engines, `api/` for external API clients, `html/` for fetching, `validators/`, and `utils/`. |
| `src/types` | TypeScript interfaces and types shared across the application. |
| `src/config` | Environment-safe configuration constants. |
| `supabase/` | Database migrations and Supabase CLI config. |
| `public/` | Static assets served at root path. |
| `docs/` | Architecture and roadmap documentation. |

---

## 8. MVP vs Post-MVP

### MVP (Scope for Initial Build)

| Feature | Rationale |
|---|---|
| URL input + validation | Core UX entry point |
| Single-page results dashboard | Must display scores for all 6 dimensions |
| SEO analysis | Meta tags, OG, Twitter, canonical, robots — all static HTML parsing |
| Structure analysis | Heading hierarchy + semantic element detection |
| Accessibility analysis | Alt text, ARIA, lang — WCAG quick wins |
| PageSpeed Insights integration | LCP, FID/INP, CLS, Performance score — external API |
| Gemini Flash AI-readiness assessment | LLM-powered qualitative review |
| Weighted overall score | Single-number output for quick comprehension |
| Analysis history (last N) | Allows re-visiting without re-submitting |
| Loading/skeleton states | Professional UX during analysis (5–10 seconds typical) |
| Error handling + retry | Network and API failures are expected |
| Responsive design | Mobile-first Tailwind |

### Post-MVP

| Feature | Rationale |
|---|---|
| User authentication | Adds account management complexity |
| Scheduled re-analyses | Requires cron, webhooks, or pg_cron |
| PDF report export | Nice-to-have, not core to the analysis |
| Competitive comparison | Multi-URL workflow — scope increase |
| Team/shared workspaces | Multi-tenant auth complexity |
| Custom preset score weights | Adds configuration UI surface |
| History search & filters | Adds query complexity |
| Email reports | Requires email service integration |
| API rate-limit dashboard | Operational, not product |

---

## 9. Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **PageSpeed API rate limits** (free: ~240/day by default) | Blocked analyses | Cache identical URLs; queue requests; upgrade to paid tier if needed |
| **Gemini API cost + rate limits** | Failed or slow AI analysis | Cache Gemini responses by URL; use structured JSON mode; retry with exponential backoff |
| **Slow or unresponsive target URLs** | Route handler timeouts (Vercel limit: 60s) | Set `fetch()` timeout of 15s; abort gracefully; store partial results |
| **Large HTML payloads** | Memory pressure on server | Truncate HTML to first 200KB before parsing |
| **Supabase free-tier limits** (500 MB DB, 2 GB bandwidth) | Storage cap | Delete analyses older than 30 days via cron; paginate API responses |
| **Gemini hallucination / malformed output** | Wrong scores | Use `response_mime_type: "application/json"`; validate response schema before persisting; fallback to mid-range score on parse failure |
| **CORS / fetch restrictions on target URLs** | Cannot fetch page content | All fetches are server-side (no CORS issue); handle redirects; block non-HTTP(S) protocols |
| **SPA / JavaScript-rendered pages** | Missing content | Note limitation in the report; optionally use Puppeteer in post-MVP |
| **Vercel serverless cold starts** | Slow first request | Use Vercel's "serverless functions with keep-alive" or provisioned concurrency; analyze warm-up costs |

---

## 10. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Response time (API) | < 15 seconds for a typical analysis |
| Uptime | Standard Vercel Pro SLA |
| Accessibility target | WCAG 2.1 AA for the analyzer UI itself |
| Lighthouse score (app) | > 90 Performance, > 90 Accessibility |
| Data retention | 30 days auto-cleanup for unauthenticated analyses |
| Error rate | < 1% of analysis requests |
