import {
  CATEGORY_SEARCH_HINTS,
  getJurisdiction,
  hostMatchesApprovedDomain,
  isSupportedCategory,
  type CategoryId,
} from '../_shared/jurisdictions.ts'
import { jsonNestingDepth, validateResearchQuery } from '../_shared/inputValidation.ts'
import {
  isGeneralOfficialGuidance,
  shouldRetainSourceForQuery,
  tavilyAnswerIsDisplayable,
} from '../_shared/sourceAuthority.ts'
import { clipText, parseOfficialHttpsUrl } from '../_shared/urlSafety.ts'

const TAVILY_URL = 'https://api.tavily.com/search'
const TAVILY_MAX_RESULTS = 10
const MAX_SUPPORTING_SOURCES = 4
const TAVILY_TIMEOUT_MS = 15000
const MAX_TAVILY_RESPONSE_BYTES = 1_000_000
const MAX_TITLE_LENGTH = 300
const MAX_EXCERPT_LENGTH = 800
const MAX_SECTION_LENGTH = 80
const MAX_SUMMARY_LENGTH = 4000
const MAX_JSON_DEPTH = 6

const baseCorsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
}

const responseHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'are',
  'but',
  'not',
  'you',
  'all',
  'can',
  'her',
  'was',
  'one',
  'our',
  'out',
  'has',
  'have',
  'had',
  'were',
  'been',
  'how',
  'what',
  'when',
  'where',
  'who',
  'why',
  'does',
  'did',
  'need',
  'needed',
  'get',
  'got',
  'any',
  'from',
  'with',
  'this',
  'that',
  'will',
  'would',
  'should',
  'about',
  'into',
  'over',
  'your',
  'a',
  'an',
  'or',
  'of',
  'to',
  'in',
  'on',
  'at',
  'by',
  'is',
  'it',
  'if',
  'be',
  'do',
  'my',
  'please',
  'tell',
  'explain',
])

const CLEARLY_UNRELATED_MARKERS = [
  'hazardous material',
  'aboveground',
  'underground storage',
  'fuel tank',
  'marriage license',
  'birth certificate',
  'parking ticket',
  'dog license',
  'animal license',
]

const VERY_LOW_SCORE = 0.08
const MAX_REQUEST_BYTES = 20_000

const GENERIC_QUERY_TERMS = new Set([
  'building',
  'city',
  'code',
  'construction',
  'existing',
  'permit',
  'replace',
  'residential',
  'work',
])

const SECTION_PATTERN =
  /\b(?:[Ss][Ee][Cc][Tt][Ii][Oo][Nn]|[Ss][Ee][Cc]\.)\s+(?:[A-Z]{2,4}\s+)?[A-Za-z]?\d[\w.\-()]*|(?:\b[A-Z]{1,4}\s+)?§\s*[A-Za-z]?\d[\w.\-()]*/

type TavilyResult = {
  title?: string
  url?: string
  content?: string
  score?: number
}

type OfficialResult = {
  title: string
  url: string
  domain: string
  excerpt: string
  score: number | null
  sectionNumber: string | null
  matchCount: number
  topicMatchCount: number
  isGeneralGuidance: boolean
}

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const configured = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
  const allowRequested = Boolean(origin) && (isLocalhost || configured.includes(origin))
  const allowOrigin = allowRequested ? origin : configured.length === 0 ? '*' : configured[0]

  return {
    ...baseCorsHeaders,
    'Access-Control-Allow-Origin': allowOrigin,
  }
}

function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), ...responseHeaders, 'Content-Type': 'application/json' },
  })
}

function parseHostname(urlString: string): string | null {
  const url = parseOfficialHttpsUrl(urlString)
  return url ? url.hostname.toLowerCase() : null
}

function canonicalUrl(urlString: string): string | null {
  const url = parseOfficialHttpsUrl(urlString)
  if (!url) return null
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key)
  }
  const path = url.pathname.replace(/\/+$/, '') || '/'
  return `${url.protocol}//${url.hostname.toLowerCase()}${path}${url.search}`
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((term) => term.length > 2)
}

function distinctiveTerms(text: string): string[] {
  const unique = new Set<string>()
  for (const term of tokenize(text)) {
    if (!STOP_WORDS.has(term)) unique.add(term)
  }
  return [...unique]
}

function termMatches(haystack: string, term: string): boolean {
  if (haystack.includes(term)) return true
  if (term.length >= 4 && haystack.includes(`${term}s`)) return true
  if (term.endsWith('s') && term.length >= 5 && haystack.includes(term.slice(0, -1))) return true
  return false
}

function matchCount(terms: string[], haystack: string): number {
  if (terms.length === 0) return 0
  return terms.reduce((count, term) => (termMatches(haystack, term) ? count + 1 : count), 0)
}

function isClearlyUnrelated(query: string, title: string, excerpt: string): boolean {
  const queryText = query.toLowerCase()
  const haystack = `${title} ${excerpt}`.toLowerCase()
  return CLEARLY_UNRELATED_MARKERS.some(
    (marker) => haystack.includes(marker) && !queryText.includes(marker),
  )
}

function compactSnippet(text: string, maxLength = 220): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}

function summaryFromRetainedSources(
  results: Array<{ title: string; url: string; excerpt: string }>,
  tavilyAnswer: string | null,
  query: string,
): string | null {
  if (results.length === 0 || !tavilyAnswer?.trim()) return null
  if (!tavilyAnswerIsDisplayable(tavilyAnswer, results, query)) return null
  const cleanAnswer = tavilyAnswer.replace(/\s*\[\d+\]/g, '').trim()
  if (!cleanAnswer) return null
  return clipText(
    `${cleanAnswer} ${results.map((_, index) => `[${index + 1}]`).join('')}`,
    MAX_SUMMARY_LENGTH,
  )
}

function extractSectionNumber(title: string, content: string): string | null {
  const match = `${title}\n${content}`.match(SECTION_PATTERN)
  if (!match) return null
  const value = match[0].replace(/\s+/g, ' ').trim()
  return value.length > MAX_SECTION_LENGTH ? clipText(value, MAX_SECTION_LENGTH) : value
}

function selectSupportingSources(
  items: TavilyResult[],
  approvedDomains: string[],
  query: string,
): OfficialResult[] {
  const queryTerms = distinctiveTerms(query)
  const topicTerms = queryTerms.filter((term) => !GENERIC_QUERY_TERMS.has(term))
  const seen = new Set<string>()
  const seenTitles = new Set<string>()
  const seenExcerpts = new Set<string>()
  const candidates: OfficialResult[] = []

  for (const item of items) {
    if (typeof item.url !== 'string' || typeof item.title !== 'string') continue
    if (item.content != null && typeof item.content !== 'string') continue
    if (!shouldRetainSourceForQuery(query, item.title, item.url)) continue
    const hostname = parseHostname(item.url)
    if (!hostname || !hostMatchesApprovedDomain(hostname, approvedDomains)) continue
    const excerpt = clipText(item.content ?? '', MAX_EXCERPT_LENGTH)
    if (!excerpt) continue
    const canonical = canonicalUrl(item.url)
    if (!canonical || seen.has(canonical)) continue

    const title = clipText(item.title, MAX_TITLE_LENGTH)
    const titleFingerprint = title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    const excerptFingerprint = compactSnippet(excerpt, 180)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
    if (seenTitles.has(titleFingerprint) || seenExcerpts.has(excerptFingerprint)) continue
    seen.add(canonical)
    seenTitles.add(titleFingerprint)
    seenExcerpts.add(excerptFingerprint)

    const haystack = `${title} ${excerpt}`.toLowerCase()
    const queryMatches = matchCount(queryTerms, haystack)
    const topicMatches = matchCount(topicTerms, haystack)

    candidates.push({
      title,
      url: canonical,
      domain: hostname,
      excerpt,
      score: typeof item.score === 'number' && Number.isFinite(item.score) ? item.score : null,
      sectionNumber: extractSectionNumber(title, excerpt),
      matchCount: queryMatches,
      topicMatchCount: topicMatches,
      isGeneralGuidance: isGeneralOfficialGuidance(title, canonical),
    })
  }

  const usable = candidates.filter((item) => {
    if (isClearlyUnrelated(query, item.title, item.excerpt)) return false
    const strongOfficialHit =
      item.score !== null &&
      item.score >= 0.25 &&
      (item.topicMatchCount > 0 || topicTerms.length === 0)
    if (strongOfficialHit) return true
    const veryLow = item.score !== null && item.score < VERY_LOW_SCORE
    if (veryLow && item.matchCount === 0) return false
    if (topicTerms.length > 0 && item.topicMatchCount === 0 && (item.score ?? 0) < 0.65) {
      return false
    }
    return item.matchCount > 0 || (item.score ?? 0) >= 0.45
  })

  const officialPool =
    usable.length > 0
      ? usable
      : candidates.filter((item) => !isClearlyUnrelated(query, item.title, item.excerpt))

  const ranked = officialPool
    .sort((a, b) => {
      if (a.isGeneralGuidance !== b.isGeneralGuidance) return a.isGeneralGuidance ? -1 : 1
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0)
      if (Math.abs(scoreDiff) > 0.01) return scoreDiff
      return b.matchCount - a.matchCount
    })
    .slice(0, MAX_SUPPORTING_SOURCES)

  return ranked.map(
    ({
      matchCount: _matchCount,
      topicMatchCount: _topicMatchCount,
      isGeneralGuidance: _isGeneralGuidance,
      ...result
    }) => result,
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeadersFor(req), ...responseHeaders } })
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      req,
      { error: { code: 'INVALID_REQUEST', message: 'POST required.' } },
      405,
    )
  }

  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse(
      req,
      { error: { code: 'INVALID_REQUEST', message: 'Request body is too large.' } },
      413,
    )
  }

  const contentType = req.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.includes('application/json')) {
    return jsonResponse(
      req,
      { error: { code: 'INVALID_REQUEST', message: 'Content-Type must be application/json.' } },
      415,
    )
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse(
      req,
      { error: { code: 'UNAUTHORIZED', message: 'A signed-in session is required.' } },
      401,
    )
  }

  let rawBody = ''
  try {
    rawBody = await req.text()
  } catch {
    return jsonResponse(
      req,
      { error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body.' } },
      400,
    )
  }

  if (rawBody.length > MAX_REQUEST_BYTES) {
    return jsonResponse(
      req,
      { error: { code: 'INVALID_REQUEST', message: 'Request body is too large.' } },
      413,
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return jsonResponse(
      req,
      { error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body.' } },
      400,
    )
  }

  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    jsonNestingDepth(parsed) > MAX_JSON_DEPTH
  ) {
    return jsonResponse(
      req,
      { error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body.' } },
      400,
    )
  }

  const payload = parsed as { municipalityId?: unknown; categoryId?: unknown; query?: unknown }
  const municipalityId =
    typeof payload.municipalityId === 'string' ? payload.municipalityId.trim() : ''
  const categoryId = typeof payload.categoryId === 'string' ? payload.categoryId.trim() : ''
  const queryResult = validateResearchQuery(payload.query)

  if (!queryResult.ok) {
    return jsonResponse(
      req,
      { error: { code: 'INVALID_QUERY', message: queryResult.message } },
      400,
    )
  }

  const query = queryResult.query

  const jurisdiction = getJurisdiction(municipalityId)
  if (!jurisdiction) {
    return jsonResponse(
      req,
      {
        error: {
          code: 'INVALID_MUNICIPALITY',
          message: 'The selected municipality is not supported.',
        },
      },
      400,
    )
  }

  if (!isSupportedCategory(categoryId)) {
    return jsonResponse(
      req,
      { error: { code: 'UNSUPPORTED_CATEGORY', message: 'The selected category is not supported.' } },
      400,
    )
  }

  const tavilyKey = Deno.env.get('TAVILY_API_KEY')
  if (!tavilyKey) {
    return jsonResponse(
      req,
      {
        error: {
          code: 'MISSING_TAVILY_KEY',
          message: 'Official source search is not configured on the server.',
        },
      },
      500,
    )
  }

  const approvedDomains = jurisdiction.approvedDomains
  const categoryHint = CATEGORY_SEARCH_HINTS[categoryId as CategoryId]
  const tavilyQuery = `${query} ${jurisdiction.displayName} ${categoryHint}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TAVILY_TIMEOUT_MS)

  try {
    const tavilyResponse = await fetch(TAVILY_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tavilyKey}`,
      },
      body: JSON.stringify({
        query: tavilyQuery,
        max_results: TAVILY_MAX_RESULTS,
        include_domains: approvedDomains,
        search_depth: 'basic',
        include_answer: 'basic',
      }),
    })

    if (tavilyResponse.status === 429) {
      return jsonResponse(
        req,
        {
          error: {
            code: 'RATE_LIMIT',
            message: 'Official source search is temporarily rate-limited. Try again shortly.',
          },
        },
        429,
      )
    }

    if (!tavilyResponse.ok) {
      return jsonResponse(
        req,
        {
          error: {
            code: 'TAVILY_ERROR',
            message:
              'Official source search failed. This does not mean no building-code requirement exists.',
          },
        },
        502,
      )
    }

    const tavilyRaw = await tavilyResponse.text()
    if (tavilyRaw.length > MAX_TAVILY_RESPONSE_BYTES) {
      return jsonResponse(
        req,
        {
          error: {
            code: 'TAVILY_ERROR',
            message:
              'Official source search failed. This does not mean no building-code requirement exists.',
          },
        },
        502,
      )
    }

    let data: { answer?: unknown; results?: unknown }
    try {
      data = JSON.parse(tavilyRaw) as { answer?: unknown; results?: unknown }
    } catch {
      return jsonResponse(
        req,
        {
          error: {
            code: 'TAVILY_ERROR',
            message:
              'Official source search failed. This does not mean no building-code requirement exists.',
          },
        },
        502,
      )
    }

    const retrievedAt = new Date().toISOString()
    const tavilyResults = Array.isArray(data.results) ? (data.results as TavilyResult[]) : []
    const results = selectSupportingSources(tavilyResults, approvedDomains, query)
    const tavilyAnswer =
      typeof data.answer === 'string' && data.answer.trim()
        ? clipText(data.answer, MAX_SUMMARY_LENGTH)
        : null
    const summary = summaryFromRetainedSources(results, tavilyAnswer, query)

    return jsonResponse(req, {
      municipalityId,
      categoryId,
      retrievedAt,
      summary,
      results,
    })
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError'
    if (aborted) {
      return jsonResponse(
        req,
        {
          error: {
            code: 'TIMEOUT',
            message:
              'Official source search timed out. This does not mean no building-code requirement exists.',
          },
        },
        504,
      )
    }
    return jsonResponse(
      req,
      {
        error: {
          code: 'TAVILY_ERROR',
          message:
            'Official source search failed. This does not mean no building-code requirement exists.',
        },
      },
      502,
    )
  } finally {
    clearTimeout(timeout)
  }
})
