export function parseOfficialHttpsUrl(urlString: string): URL | null {
  try {
    const url = new URL(urlString)
    if (url.protocol !== 'https:') return null
    if (url.username || url.password) return null
    if (!url.hostname) return null
    return url
  } catch {
    return null
  }
}

export function clipText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}
