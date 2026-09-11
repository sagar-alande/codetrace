export type SourceStatus = 'official' | 'prototype'

export type DocumentStatus = 'active' | 'inactive'

export type DocumentType =
  | 'base_code'
  | 'local_amendment'
  | 'permit_guidance'
  | 'prototype_note'

export type FeedbackRating = 'helpful' | 'not_helpful' | 'report_incorrect'

export type SourceMode = 'official' | 'prototype' | 'insufficient_official'

export type Municipality = {
  id: string
  name: string
  state: string
  displayName: string
}

export type Category = {
  id: string
  label: string
}

export type CorpusRecord = {
  id: string
  municipalityId: string
  state: string
  categoryId: string
  documentType: DocumentType
  documentTitle: string
  sectionNumber: string
  sectionTitle: string
  textContent: string
  pageNumber?: number
  codeEdition?: string
  effectiveDate?: string
  supersededDate?: string
  status: DocumentStatus
  sourceUrl?: string
  sourceStatus: SourceStatus
}

export type Citation = {
  recordId: string
  title: string
  excerpt: string
  sourceStatus: SourceStatus
  url?: string
  domain?: string
  retrievedAt?: string
  municipalityName?: string
  relevanceScore?: number | null
  sectionNumber?: string
  documentTitle?: string
}

export type ResearchAnswer = {
  summary: string
  citations: Citation[]
  isFallback: boolean
  includesPrototypeSources: boolean
  sourceMode: SourceMode
  retrievedAt?: string
}

export type HistoryItem = {
  id: string
  createdAt: string
  municipalityId: string
  municipalityName: string
  state: string
  categoryId: string
  categoryLabel: string
  queryText: string
  answerText: string
  isFallback: boolean
  citations: Citation[]
  includesPrototypeSources: boolean
  sourceMode: SourceMode
}

export type OfficialSearchResult = {
  title: string
  url: string
  domain: string
  excerpt: string
  score: number | null
  sectionNumber: string | null
}

export type OfficialSearchResponse = {
  municipalityId: string
  categoryId: string
  retrievedAt: string
  summary: string | null
  results: OfficialSearchResult[]
}

export type SearchFunctionError = {
  code: string
  message: string
}
