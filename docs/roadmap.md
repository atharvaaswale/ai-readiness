# AI Readiness Analyzer — Roadmap

> **Status:** Pre-development (architecture phase)
> **Estimated total:** 3–4 weeks for MVP

---

## Phase 1 — Foundation (Days 1–4)

**Goal:** Scaffold the project, connect the data layer, and prove the core API integrations work.

| Task | Deliverable | Notes |
|---|---|---|
| 1.1 Initialize Next.js project | `npx create-next-app` with TS + Tailwind, App Router | Set up ESLint, Prettier |
| 1.2 Configure Supabase project | Database project + `config.toml` + client lib | Enable Row-Level Security later |
| 1.3 Write SQL migrations | `analyses`, `page_data`, `core_web_vitals`, `ai_analysis` tables | Run via `supabase migration up` |
| 1.4 Set up environment variables | `.env.example` with all API keys + Supabase URL | Validate on startup |
| 1.5 Build URL input form | `AnalysisForm` component with client-side validation | Regex + reachability check |
| 1.6 Integrate PageSpeed API | `lib/api/pagespeed.ts` — fetch & parse CWV | Verify with a known URL |
| 1.7 Integrate Gemini API | `lib/api/gemini.ts` — structured prompt → JSON response | Use `response_mime_type: application/json` |
| 1.8 Create `/api/analyze` POST handler | Wires input → validate → fetch → PSI → Gemini → store | Returns `{ analysisId }` |
| 1.9 Create `/api/results/:id` GET handler | Returns full joined result by ID | Includes `status` field |

**Exit criteria:** Submitting a URL via the form produces a completed analysis row in Supabase with populated child tables.

---

## Phase 2 — Analysis Engine (Days 5–10)

**Goal:** Build the server-side analysis pipeline for all six dimensions.

| Task | Deliverable | Notes |
|---|---|---|
| 2.1 HTML fetcher with timeout | `lib/html/fetcher.ts` — 15s timeout, 200KB truncation | Handle redirects, non-200, non-HTML |
| 2.2 SEO analyzer | `lib/analyzers/seo.ts` — parse `<title>`, `<meta>`, OG, Twitter, canonical, robots | Produce pass/fail counts |
| 2.3 Structure analyzer | `lib/analyzers/structure.ts` — heading outline, semantic elements, landmarks | Score based on hierarchy quality |
| 2.4 Accessibility analyzer | `lib/analyzers/accessibility.ts` — alt text, ARIA, lang, roles | Flag missing items |
| 2.5 Discoverability analyzer | `lib/analyzers/discoverability.ts` — JSON-LD, Microdata, sitemap `<link>`, robots | Score on presence + completeness |
| 2.6 Score aggregator | `lib/analyzers/scoring.ts` — normalize 0–100 per dimension, weighted overall | Weights defined in `config/constants.ts` |
| 2.7 Orchestrate full pipeline | Single async function calling analyzers sequentially | Each step catches errors independently |
| 2.8 Wire pipeline into `/api/analyze` | Replace sync stubs with real pipeline | Keep route as async with 30s timeout |

**Exit criteria:** A real URL submission produces accurate scores across all 6 dimensions.

---

## Phase 3 — Results Dashboard (Days 11–15)

**Goal:** Build the UI that displays analysis results.

| Task | Deliverable | Notes |
|---|---|---|
| 3.1 Results page layout | `app/results/[id]/page.tsx` + dashboard skeleton | Fetch from `/api/results/:id` |
| 3.2 Score gauge component | `ScoreGauge` — radial SVG, color-coded (red/yellow/green) | Reusable per dimension |
| 3.3 Score card component | `ScoreCard` — gauge + label + key finding | One per dimension |
| 3.4 Overall score hero | Large central score with grade label (A/B/C/D/F) | Prominent at top of dashboard |
| 3.5 Findings lists | `FindingList` per dimension — what passed, what failed | Collapsible sections |
| 3.6 Recommendations panel | `RecommendationList` from Gemini output — priority-coded | High/medium/low badges |
| 3.7 Loading state | `loading.tsx` with shimmer skeletons per card | Essential for 5–10s analysis |
| 3.8 Error state | `error.tsx` with retry button and error message | Handle API failures gracefully |
| 3.9 History page | `app/history/page.tsx` — list of past analyses | Ordered by `created_at DESC`, limit 20 |

**Exit criteria:** Full results dashboard renders with live data from a completed analysis.

---

## Phase 4 — Polish & Edge Cases (Days 16–20)

**Goal:** Handle failures, improve UX, ensure production readiness.

| Task | Deliverable | Notes |
|---|---|---|
| 4.1 Error categorization | Custom error classes for timeout, invalid URL, API failure, parse error | Human-readable messages |
| 4.2 Retry logic | Exponential backoff for PageSpeed + Gemini API calls | Max 3 retries |
| 4.3 Partial results | Store as much as possible if a single analyzer fails | Show "N/A" for failed dimension |
| 4.4 Responsive design audit | Test all pages at 320px, 768px, 1280px, 1920px | Fix layout breaks |
| 4.5 Accessibility audit (UI) | Run Lighthouse + axe on the app itself | Target WCAG 2.1 AA |
| 4.6 Performance optimization | Image optimization, bundle analysis, lazy loading | Keep core bundle < 150KB |
| 4.7 History cleanup | Migration with TTL policy (delete analyses > 30 days) | Supabase cron or periodic check |
| 4.8 Rate-limit safety | Check remaining quota before calling external APIs | Graceful degradation |
| 4.9 Edge case URL tests | IPFS, localhost, non-HTTP, redirect chains, SPAs | Document known limitations |

**Exit criteria:** App handles all expected failure modes without crashing and meets Lighthouse > 90 targets.

---

## Phase 5 — Launch Prep (Days 21–25)

**Goal:** Deploy, document, and demonstrate.

| Task | Deliverable | Notes |
|---|---|---|
| 5.1 Vercel deployment | Configure `vercel.json`, env vars, Supabase connection | Preview + production branches |
| 5.2 Supabase production hardening | Enable RLS (if auth), connection pooling, backup | Lock down service-role key |
| 5.3 Monitoring setup | Vercel Analytics + `console.error` structured logging | Track error rates |
| 5.4 README | Setup instructions, env vars, architecture overview, demo guide | Keep it concise |
| 5.5 Demo walkthrough | Record Loom / write step-through | Cover happy path + error handling |
| 5.6 Final code review | Lint, type-check, audit deps, check for secrets in git | Clean up TODOs |

**Exit criteria:** App is live on Vercel, documented, and ready for demonstration.

---

## Future Phases (Post-MVP)

| Phase | Features | Effort |
|---|---|---|
| **Auth & Personalization** (Phase 6) | Supabase Auth (Google/GitHub), per-user history, saved URLs | ~1 week |
| **Scheduled Analysis** (Phase 7) | Vercel Cron Jobs or `pg_cron` for weekly re-analysis, email alerts | ~1 week |
| **Competitive Comparison** (Phase 8) | Multi-URL submission, side-by-side score table, diff view | ~1 week |
| **PDF Report Export** (Phase 9) | Server-side PDF generation (jsPDF, Puppeteer, or PDF.co) | ~3 days |
| **API for External Integrations** (Phase 10) | Rate-limited public API keys, webhook callbacks | ~1 week |
| **Advanced Accessibility** (Phase 11) | Contrast ratio calculation, keyboard trap detection, focus order | ~3 days |
| **JavaScript Rendering** (Phase 12) | Puppeteer/Lighthouse in a serverless function for SPA analysis | ~1 week |

---

## Milestone Summary

```
Day  1 ─┤ Phase 1 — Foundation
Day  4 ─┤ └── URL → Supabase row works
Day  5 ─┤ Phase 2 — Analysis Engine
Day 10 ─┤ └── All 6 dimensions scored
Day 11 ─┤ Phase 3 — Results Dashboard
Day 15 ─┤ └── Full UI with live data
Day 16 ─┤ Phase 4 — Polish & Edge Cases
Day 20 ─┤ └── Production ready
Day 21 ─┤ Phase 5 — Launch Prep
Day 25 ─┤ └── LIVE on Vercel
```

---

## Dependency Graph

```
Phase 1 ──────┐
              ├──> Phase 2 ──> Phase 3 ──> Phase 4 ──> Phase 5
HTML Fetcher ──┘
      │
      ├── SEO Analyzer
      ├── Structure Analyzer
      ├── A11y Analyzer
      ├── Discoverability Analyzer
      ├── PageSpeed Client
      └── Gemini Client
              │
              └── Score Aggregator
```

No phase can start before the previous phase is complete because each builds on the data structures and integrations of the prior phase.
