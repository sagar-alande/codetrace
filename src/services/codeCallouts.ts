export type CodeCallout = {
  kind: 'section' | 'dimension' | 'area' | 'slope' | 'percent'
  label: string
}

const MAX_CALLOUTS = 8

function pushUnique(map: Map<string, CodeCallout>, callout: CodeCallout) {
  const key = `${callout.kind}:${callout.label.toLowerCase()}`
  if (!map.has(key)) map.set(key, callout)
}

/**
 * Pulls the concrete, drawable requirements out of an answer + its cited
 * excerpts — code section numbers, lengths, areas, slopes, percentages —
 * so the blueprint can annotate the passage the answer was traced from.
 * Purely descriptive: it never invents a value that is not in the text.
 */
export function extractCodeCallouts(texts: Array<string | undefined>): CodeCallout[] {
  const joined = texts.filter(Boolean).join('     ')
  const found = new Map<string, CodeCallout>()

  // Code section references: "Section R310.2.1", "§ 1011.5", "IRC R311.7"
  const sectionRe =
    /(?:section|sec\.?|§|\bIRC\b|\bIBC\b)\s*([A-Z]{0,3}\d{2,4}(?:\.\d+){0,4})|\b([R]\d{3}(?:\.\d+){1,4})\b/gi
  for (const match of joined.matchAll(sectionRe)) {
    const ref = (match[1] ?? match[2] ?? '').toUpperCase()
    if (ref) pushUnique(found, { kind: 'section', label: `§ ${ref}` })
  }

  // Lengths: inches / feet, incl. fractions and inch/foot marks
  const lengthRe =
    /(\d{1,3}(?:\.\d+)?|\d{1,2}\s?\d\/\d)\s?-?\s?(inch(?:es)?|in\.?|"|feet|foot|ft\.?|')(?![a-z])/gi
  for (const match of joined.matchAll(lengthRe)) {
    const value = match[1].replace(/\s+/g, ' ').trim()
    const unit = match[2].toLowerCase()
    const short = /^(feet|foot|ft\.?|')$/.test(unit) ? `${value}'` : `${value}"`
    pushUnique(found, { kind: 'dimension', label: short })
  }

  // Areas: square feet
  const areaRe = /(\d{1,4}(?:\.\d+)?)\s?(?:square\s?feet|square\s?foot|sq\.?\s?ft\.?|sf)\b/gi
  for (const match of joined.matchAll(areaRe)) {
    pushUnique(found, { kind: 'area', label: `${match[1]} sq ft` })
  }

  // Slope: "x:12" or "x in 12"
  const slopeRe = /(\d{1,2}(?:\.\d+)?)\s?(?::|in)\s?12\b/gi
  for (const match of joined.matchAll(slopeRe)) {
    pushUnique(found, { kind: 'slope', label: `${match[1]}:12 slope` })
  }

  // Percentages: lot coverage, slope, etc.
  const percentRe = /(\d{1,3}(?:\.\d+)?)\s?(?:percent|%)/gi
  for (const match of joined.matchAll(percentRe)) {
    pushUnique(found, { kind: 'percent', label: `${match[1]}%` })
  }

  const order: CodeCallout['kind'][] = ['section', 'dimension', 'area', 'slope', 'percent']
  return [...found.values()]
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
    .slice(0, MAX_CALLOUTS)
}
