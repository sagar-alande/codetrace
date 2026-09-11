import type { Citation, SourceMode, SourceStatus } from '../types/research'
import { safeHttpUrl } from './text.ts'

export const MAX_STORED_ANSWER_LENGTH = 4000
export const MAX_STORED_CITATIONS = 4
const MAX_TITLE_LENGTH = 300
const MAX_EXCERPT_LENGTH = 800
const MAX_SECTION_LENGTH = 80
const MAX_DOMAIN_LENGTH = 253

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const HOSTNAME_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

function clipText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

export function clipStoredAnswer(value: string): string {
  return clipText(value, MAX_STORED_ANSWER_LENGTH)
}

function sanitizeDomain(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const domain = value.trim().toLowerCase()
  if (!domain || domain.length > MAX_DOMAIN_LENGTH) return undefined
  if (!HOSTNAME_PATTERN.test(domain)) return undefined
  return domain
}

export function sanitizeCitations(raw: unknown): Citation[] {
  if (!Array.isArray(raw)) return []

  const citations: Citation[] = []
  for (const item of raw.slice(0, MAX_STORED_CITATIONS)) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const title = typeof record.title === 'string' ? clipText(record.title, MAX_TITLE_LENGTH) : ''
    const excerpt = typeof record.excerpt === 'string' ? clipText(record.excerpt, MAX_EXCERPT_LENGTH) : ''
    if (!title || !excerpt) continue

    const sourceStatus: SourceStatus = record.sourceStatus === 'official' ? 'official' : 'prototype'
    const safeUrl = typeof record.url === 'string' ? safeHttpUrl(record.url) ?? undefined : undefined
    const sectionNumber =
      typeof record.sectionNumber === 'string'
        ? clipText(record.sectionNumber, MAX_SECTION_LENGTH) || undefined
        : undefined

    citations.push({
      recordId: typeof record.recordId === 'string' ? clipText(record.recordId, 200) : `stored-${citations.length}`,
      title,
      excerpt,
      sourceStatus: safeUrl ? sourceStatus : sourceStatus === 'official' ? 'official' : 'prototype',
      url: safeUrl,
      domain: sanitizeDomain(record.domain),
      retrievedAt: typeof record.retrievedAt === 'string' ? record.retrievedAt : undefined,
      municipalityName:
        typeof record.municipalityName === 'string'
          ? clipText(record.municipalityName, 120)
          : undefined,
      relevanceScore: typeof record.relevanceScore === 'number' ? record.relevanceScore : null,
      sectionNumber,
      documentTitle:
        typeof record.documentTitle === 'string'
          ? clipText(record.documentTitle, MAX_TITLE_LENGTH)
          : undefined,
    })
  }

  return citations
}

export function sanitizeSourceMode(value: unknown): SourceMode | undefined {
  if (value === 'official' || value === 'prototype' || value === 'insufficient_official') {
    return value
  }
  return undefined
}
