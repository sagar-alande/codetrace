export type SourceText = {
  title: string
  url?: string
  excerpt?: string
}

const CASE_BODY =
  /zoning[\s_-]*board|board[\s_-]*of[\s_-]*appeals|\bzbaa?\b|zoning[\s_-]*appeals/
const CASE_KIND =
  /agenda|minutes|decision|hearing[\s_-]*calendar|hearing|calendar|variance[\s_-]*application|variation[\s_-]*application|application|administrative[\s_-]*review|docket|case[\s_-]*no/
const STREET_ADDRESS =
  /\b\d{1,6}\s+[a-z0-9.'-]+(?:\s+[a-z0-9.'-]+){0,3}\s+(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|lane|ln\.?|drive|dr\.?|way|place|pl\.?|court|ct\.?|parkway|pkwy\.?)\b/i

function haystack(title: string, url = ''): string {
  return `${title} ${url}`.toLowerCase()
}

export function isCaseSpecificDocument(title: string, url = ''): boolean {
  const text = haystack(title, url)
  if (CASE_BODY.test(text) && (CASE_KIND.test(text) || /\.pdf(?:$|[?#])/.test(text))) return true
  if (/zoning_board_of_appeals|zoning-board-of-appeals|\/zbav\//.test(text)) return true
  if (/meeting[\s_-]*minutes/.test(text)) return true
  if (/hearing[\s_-]*calendar/.test(text)) return true
  if (/(?:variance|variation)[\s_-]*application/.test(text)) return true
  if (/administrative[\s_-]*review/.test(text) && /(?:case|application|hearing|decision)/.test(text)) {
    return true
  }
  return false
}

export function queryRequestsCaseSpecificDocument(query: string): boolean {
  const q = query.toLowerCase()
  if (/\b(?:case|application|docket|appeal)\s*(?:no\.?|number|#)\s*[a-z0-9-]+/.test(q)) return true
  if (STREET_ADDRESS.test(query)) return true
  if (/\bhearing\b/.test(q) && /\b(?:on|for|calendar|date|agenda|about)\b/.test(q)) return true
  if (
    /\b(?:decision|agenda|minutes|application|variance|variation)\b/.test(q) &&
    CASE_BODY.test(q)
  ) {
    return true
  }
  return false
}

export function shouldRetainSourceForQuery(query: string, title: string, url = ''): boolean {
  if (!isCaseSpecificDocument(title, url)) return true
  return queryRequestsCaseSpecificDocument(query)
}

export function isGeneralOfficialGuidance(title: string, url = ''): boolean {
  if (isCaseSpecificDocument(title, url)) return false
  const text = haystack(title, url)
  if (
    /municipal\s+code|building\s+code|zoning\s+(?:code|ordinance)|code\s+of\s+ordinances|permit\s+(?:guide|handbook|requirement)|exempt\s+work|project\s+requirement|department\s+(?:of\s+)?buildings|setback|permit\s+process|how\s+to\s+(?:get\s+)?a?\s*permit/.test(
      text,
    )
  ) {
    return true
  }
  return /\/(?:building|buildings|zoning|permits?|code|ordinance)(?:\/|$)/.test(text)
}

export function pickStrongSources<T extends SourceText>(sources: T[], query: string): T[] {
  const general = sources.filter((item) => isGeneralOfficialGuidance(item.title, item.url ?? ''))
  if (general.length > 0) return general
  if (queryRequestsCaseSpecificDocument(query)) {
    return sources.filter((item) => isCaseSpecificDocument(item.title, item.url ?? ''))
  }
  return []
}

type MeasureKind = 'length' | 'area'

type Measure = {
  value: number
  kind: MeasureKind
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseMeasureNumber(raw: string): number {
  return Number(raw.replace(/,/g, ''))
}

export function extractNumericRequirements(text: string): Measure[] {
  const cleaned = text.replace(/\s*\[\d+\]/g, ' ')
  const found: Measure[] = []
  const seen = new Set<string>()

  const add = (raw: string, kind: MeasureKind) => {
    const value = parseMeasureNumber(raw)
    if (!Number.isFinite(value)) return
    const key = `${value}:${kind}`
    if (seen.has(key)) return
    seen.add(key)
    found.push({ value, kind })
  }

  for (const match of cleaned.matchAll(
    /(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(?:square\s+feet|sq\.?\s*ft\.?|sq\.?\s*feet)/gi,
  )) {
    add(match[1], 'area')
  }

  for (const match of cleaned.matchAll(
    /(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(?:\s*-\s*|\s+)(?:foot|feet|ft\.?)\b/gi,
  )) {
    add(match[1], 'length')
  }

  return found
}

function sourceStatesMeasure(text: string, measure: Measure): boolean {
  const n = escapeRegExp(String(measure.value))
  if (measure.kind === 'area') {
    return new RegExp(
      `\\b${n}(?:\\.0+)?\\s*(?:square\\s+feet|sq\\.?\\s*ft\\.?|sq\\.?\\s*feet)`,
      'i',
    ).test(text)
  }
  return new RegExp(`\\b${n}(?:\\.0+)?(?:\\s*-\\s*|\\s+)(?:foot|feet|ft\\.?)\\b`, 'i').test(text)
}

export function numericClaimsSupported(answer: string, sources: SourceText[]): boolean {
  const claims = extractNumericRequirements(answer)
  if (claims.length === 0) return true
  const corpus = sources.map((item) => `${item.title}\n${item.excerpt ?? ''}`).join('\n')
  return claims.every((claim) => sourceStatesMeasure(corpus, claim))
}

export function tavilyAnswerIsDisplayable(
  answer: string | null | undefined,
  sources: SourceText[],
  query: string,
): boolean {
  if (!answer?.trim()) return false
  return numericClaimsSupported(answer, pickStrongSources(sources, query))
}
