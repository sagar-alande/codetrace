import type { Citation, CorpusRecord, OfficialSearchResult, ResearchAnswer } from '../types/research'
import { tavilyAnswerIsDisplayable } from '../../supabase/functions/_shared/sourceAuthority.ts'

export const INSUFFICIENT_OFFICIAL_MESSAGE =
  'I do not have enough information from the available official sources to answer this question.'

export const INSUFFICIENT_PROTOTYPE_MESSAGE =
  'I do not have enough information in the available CodeTrace sources to answer this question.'

function excerptFrom(record: CorpusRecord): string {
  const text = record.textContent.trim()
  return text.length > 220 ? `${text.slice(0, 217)}…` : text
}

function summaryFromOfficialResults(
  results: OfficialSearchResult[],
  tavilyAnswer: string | null | undefined,
): string {
  const provided = typeof tavilyAnswer === 'string' ? tavilyAnswer.trim() : ''
  if (!provided) return INSUFFICIENT_OFFICIAL_MESSAGE
  const hasMarkers = /\[\d+\]/.test(provided)
  return hasMarkers ? provided : `${provided} ${results.map((_, index) => `[${index + 1}]`).join('')}`
}

export function buildOfficialAnswer(
  municipalityName: string,
  results: OfficialSearchResult[],
  retrievedAt: string,
  tavilyAnswer: string | null | undefined,
  query = '',
): ResearchAnswer {
  const displayable = tavilyAnswerIsDisplayable(tavilyAnswer, results, query)
  if (results.length === 0 || !tavilyAnswer?.trim() || !displayable) {
    return {
      summary: INSUFFICIENT_OFFICIAL_MESSAGE,
      citations: [],
      isFallback: true,
      includesPrototypeSources: false,
      sourceMode: 'insufficient_official',
      retrievedAt,
    }
  }

  const citations: Citation[] = results.map((result, index) => ({
    recordId: `official-${index}-${result.url}`,
    title: result.title,
    excerpt: result.excerpt,
    sourceStatus: 'official',
    url: result.url,
    domain: result.domain,
    retrievedAt,
    municipalityName,
    relevanceScore: result.score,
    sectionNumber: result.sectionNumber ?? undefined,
  }))

  return {
    summary: summaryFromOfficialResults(results, tavilyAnswer),
    citations,
    isFallback: false,
    includesPrototypeSources: false,
    sourceMode: 'official',
    retrievedAt,
  }
}

export function buildPrototypeAnswer(
  municipalityName: string,
  categoryLabel: string,
  records: CorpusRecord[],
): ResearchAnswer {
  if (records.length === 0) {
    return {
      summary: INSUFFICIENT_PROTOTYPE_MESSAGE,
      citations: [],
      isFallback: true,
      includesPrototypeSources: true,
      sourceMode: 'prototype',
    }
  }

  const citations: Citation[] = records.map((record) => ({
    recordId: record.id,
    title: record.sectionTitle,
    excerpt: excerptFrom(record),
    sourceStatus: 'prototype',
    municipalityName,
    sectionNumber: record.sectionNumber,
    documentTitle: record.documentTitle,
  }))

  return {
    summary: `Prototype demo mode: CodeTrace is showing local sample records for ${municipalityName} (${categoryLabel.toLowerCase()}). These are Prototype References, not official municipal sources. They are not mixed with live search results.`,
    citations,
    isFallback: false,
    includesPrototypeSources: true,
    sourceMode: 'prototype',
  }
}
