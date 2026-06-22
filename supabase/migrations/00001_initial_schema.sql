-- ------------------------------------------------------------------
-- AI Readiness Analyzer — MVP Schema
-- Migration 00001: Initial tables for analysis storage
-- ------------------------------------------------------------------

-- 1. analyses — top-level analysis record
CREATE TABLE public.analyses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url             TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error_message   TEXT,

    -- Dimension scores (0–100 scale, populated on completion)
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

CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX idx_analyses_url ON public.analyses(url);

-- 2. page_data — extracted HTML and metadata
CREATE TABLE public.page_data (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id      UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,

    title            TEXT,
    meta_description TEXT,
    canonical_url    TEXT,
    robots_directives TEXT,
    og_data          JSONB,
    twitter_data     JSONB,
    structured_data  JSONB,
    headings         JSONB,
    semantic_elements JSONB,
    accessibility    JSONB,
    tech_indicators  JSONB,
    html_size_bytes  INTEGER,

    fetched_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_page_data_analysis ON public.page_data(analysis_id);

-- 3. core_web_vitals — PageSpeed Insights results
CREATE TABLE public.core_web_vitals (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id       UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,

    lcp               DECIMAL(8,2),
    fid               DECIMAL(8,2),
    inp               DECIMAL(8,2),
    cls               DECIMAL(8,3),
    performance_score DECIMAL(5,2),
    raw_response      JSONB
);

CREATE UNIQUE INDEX idx_core_web_vitals_analysis ON public.core_web_vitals(analysis_id);

-- 4. ai_analysis — Gemini Flash assessment
CREATE TABLE public.ai_analysis (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id      UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,

    gemini_model     TEXT NOT NULL,
    prompt_tokens    INTEGER,
    summary          TEXT,
    recommendations  JSONB,
    strengths        JSONB,
    weaknesses       JSONB,
    raw_response     JSONB
);

CREATE UNIQUE INDEX idx_ai_analysis_analysis ON public.ai_analysis(analysis_id);
