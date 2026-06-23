import { getSupabase } from './server'
import type { BasicAnalyzeResponse } from '@/types/api'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

function getDb(): Db | null {
  const db = getSupabase()
  if (!db) return null
  return db
}

export async function createAnalysis(url: string) {
  const db = getDb()
  if (!db) return null

  const { error } = await db.from('analyses').insert({ url, status: 'running' })

  if (error) return null

  const { data } = await db
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return null
  return data.id as string
}

export async function completeAnalysis(id: string, response: BasicAnalyzeResponse) {
  const db = getDb()
  if (!db) return

  await db.from('analyses').update({
    status: 'completed',
    overall_score: response.overallScore,
    seo_score: response.seoScore,
    structure_score: Math.round(
      (response.headingHierarchyScore + response.semanticHtmlScore) / 2
    ),
    accessibility_score: response.imageAccessibilityScore,
    discoverability_score: response.structuredDataScore,
    completed_at: new Date().toISOString(),
    page_title: response.title,
    meta_description: response.metaDescription,
    h1_count: response.h1Count,
    h2_count: response.h2Count,
    h3_count: response.h3Count,
    raw_response: response,
  }).eq('id', id)
}

export async function failAnalysis(id: string, errorMessage: string) {
  const db = getDb()
  if (!db) return

  await db.from('analyses').update({
    status: 'failed',
    error_message: errorMessage,
    completed_at: new Date().toISOString(),
  }).eq('id', id)
}

export async function getAnalysisStatus(id: string) {
  const db = getDb()
  if (!db) return null

  const { data } = await db
    .from('analyses')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) return null
  return {
    id: data.id as string,
    status: data.status as 'pending' | 'running' | 'completed' | 'failed',
    overallScore: (data.overall_score as number | null) ?? null,
  }
}

export async function getAnalysisById(id: string) {
  const db = getDb()
  if (!db) return null

  const { data } = await db
    .from('analyses')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) return null
  return data
}

export async function listRecentAnalyses(limit = 20) {
  const db = getDb()
  if (!db) return []

  const { data } = await db
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    url: row.url as string,
    overallScore: (row.overall_score as number) ?? null,
    createdAt: row.created_at as string,
    status: row.status as string,
  }))
}
