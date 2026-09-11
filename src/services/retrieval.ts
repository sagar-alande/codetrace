import { corpus } from '../data/corpus'
import type { CorpusRecord } from '../types/research'
import { tokenize } from './text'

const SCORE_THRESHOLD = 1

function isCurrentlyActive(record: CorpusRecord, today: string): boolean {
  if (record.status !== 'active') return false
  if (record.effectiveDate && record.effectiveDate > today) return false
  if (record.supersededDate && record.supersededDate <= today) return false
  return true
}

function scoreRecord(record: CorpusRecord, tokens: string[]): number {
  const haystack = `${record.sectionTitle} ${record.sectionNumber} ${record.textContent}`.toLowerCase()
  let score = 0
  for (const token of tokens) {
    if (haystack.includes(token)) score += 1
  }
  return score
}

export function retrieveRecords(
  municipalityId: string,
  categoryId: string,
  query: string,
): CorpusRecord[] {
  const today = new Date().toISOString().slice(0, 10)
  const tokens = tokenize(query)
  if (tokens.length === 0) return []

  const scoped = corpus.filter(
    (record) =>
      record.municipalityId === municipalityId &&
      record.categoryId === categoryId &&
      isCurrentlyActive(record, today),
  )

  return scoped
    .map((record) => ({ record, score: scoreRecord(record, tokens) }))
    .filter((item) => item.score >= SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.record)
}
