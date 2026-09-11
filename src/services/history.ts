import type { HistoryItem, ResearchAnswer, SourceMode } from '../types/research'
import { getCategory } from '../data/categories'
import { getMunicipality } from '../data/municipalities'
import { getSupabase } from './supabaseClient'
import { validateResearchQuery } from './queryValidation'
import {
  clipStoredAnswer,
  sanitizeCitations,
  sanitizeSourceMode,
} from './storedPayload'
import { toErrorMessage } from './text'

type HistoryRow = {
  id: string
  created_at: string
  municipality_id: string
  municipality_name: string
  state: string
  category_id: string
  category_label: string
  query_text: string
  answer_text: string
  is_fallback: boolean
  citations: HistoryItem['citations']
  includes_prototype_sources: boolean
  source_mode?: SourceMode | null
}

function inferSourceMode(row: HistoryRow): SourceMode {
  if (row.source_mode) return row.source_mode
  if (row.includes_prototype_sources) return 'prototype'
  if (row.is_fallback) return 'insufficient_official'
  return 'official'
}

function toHistoryItem(row: HistoryRow): HistoryItem {
  return {
    id: row.id,
    createdAt: row.created_at,
    municipalityId: row.municipality_id,
    municipalityName: row.municipality_name,
    state: row.state,
    categoryId: row.category_id,
    categoryLabel: row.category_label,
    queryText: row.query_text,
    answerText: clipStoredAnswer(row.answer_text),
    isFallback: row.is_fallback,
    citations: sanitizeCitations(row.citations),
    includesPrototypeSources: row.includes_prototype_sources,
    sourceMode: sanitizeSourceMode(row.source_mode) ?? inferSourceMode(row),
  }
}

export async function saveResearchHistory(input: {
  municipalityId: string
  municipalityName: string
  state: string
  categoryId: string
  categoryLabel: string
  queryText: string
  answer: ResearchAnswer
}): Promise<{ item: HistoryItem } | { error: string }> {
  try {
    const validated = validateResearchQuery(input.queryText)
    if (!validated.ok) {
      return { error: validated.message }
    }

    const municipality = getMunicipality(input.municipalityId)
    const category = getCategory(input.categoryId)
    if (!municipality || !category) {
      return { error: 'The selected municipality or category is not supported.' }
    }

    const supabase = getSupabase()
  if (!supabase) {
    return { error: 'Supabase is not configured. Research was not saved.' }
  }

  const payload = {
    municipality_id: municipality.id,
    municipality_name: municipality.displayName,
    state: municipality.state,
    category_id: category.id,
    category_label: category.label,
    query_text: validated.query,
    answer_text: clipStoredAnswer(input.answer.summary),
    is_fallback: input.answer.isFallback,
    citations: sanitizeCitations(input.answer.citations),
    includes_prototype_sources: input.answer.includesPrototypeSources,
    source_mode: sanitizeSourceMode(input.answer.sourceMode) ?? null,
  }

  let data: HistoryRow | null = null
  let error: { message: string } | null = null

  const first = await supabase
    .from('research_history')
    .insert(payload)
    .select(
      'id, created_at, municipality_id, municipality_name, state, category_id, category_label, query_text, answer_text, is_fallback, citations, includes_prototype_sources, source_mode',
    )
    .single()

  data = first.data as HistoryRow | null
  error = first.error

  if (error?.message.toLowerCase().includes('source_mode')) {
    const withoutMode = {
      municipality_id: payload.municipality_id,
      municipality_name: payload.municipality_name,
      state: payload.state,
      category_id: payload.category_id,
      category_label: payload.category_label,
      query_text: payload.query_text,
      answer_text: payload.answer_text,
      is_fallback: payload.is_fallback,
      citations: payload.citations,
      includes_prototype_sources: payload.includes_prototype_sources,
    }
    const retry = await supabase
      .from('research_history')
      .insert(withoutMode)
      .select(
        'id, created_at, municipality_id, municipality_name, state, category_id, category_label, query_text, answer_text, is_fallback, citations, includes_prototype_sources',
      )
      .single()
    data = retry.data as HistoryRow | null
    error = retry.error
  }

  if (error || !data) {
    return { error: 'Could not save this research. Check your connection and try again.' }
  }

  return { item: toHistoryItem(data as HistoryRow) }
  } catch (error) {
    return { error: toErrorMessage(error, 'Could not save this research. Try again.') }
  }
}

export async function listResearchHistory(): Promise<
  { items: HistoryItem[] } | { error: string }
> {
  try {
    const supabase = getSupabase()
  if (!supabase) {
    return { error: 'Supabase is not configured. History could not be loaded.' }
  }

  const withMode = await supabase
    .from('research_history')
    .select(
      'id, created_at, municipality_id, municipality_name, state, category_id, category_label, query_text, answer_text, is_fallback, citations, includes_prototype_sources, source_mode',
    )
    .order('created_at', { ascending: false })
    .limit(50)

  const result = withMode.error?.message.toLowerCase().includes('source_mode')
    ? await supabase
        .from('research_history')
        .select(
          'id, created_at, municipality_id, municipality_name, state, category_id, category_label, query_text, answer_text, is_fallback, citations, includes_prototype_sources',
        )
        .order('created_at', { ascending: false })
        .limit(50)
    : withMode

  if (result.error) {
    return { error: 'History could not be loaded. Check your connection and try again.' }
  }

  return { items: ((result.data ?? []) as HistoryRow[]).map(toHistoryItem) }
  } catch (error) {
    return { error: toErrorMessage(error, 'History could not be loaded. Try again.') }
  }
}
