const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'for',
  'in',
  'on',
  'to',
  'of',
  'my',
  'i',
  'im',
  'is',
  'are',
  'do',
  'does',
  'can',
  'what',
  'when',
  'where',
  'need',
  'needed',
  'this',
  'that',
  'with',
  'about',
])

export function toErrorMessage(_error: unknown, fallback: string): string {
  return fallback
}

export function safeHttpUrl(value: string | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return null
    if (url.username || url.password) return null
    return url.toString()
  } catch {
    return null
  }
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
}
