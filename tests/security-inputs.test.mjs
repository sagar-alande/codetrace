import assert from 'node:assert/strict'
import test from 'node:test'
import { jsonNestingDepth, validateResearchQuery } from '../supabase/functions/_shared/inputValidation.ts'
import { getJurisdiction, hostMatchesApprovedDomain, isSupportedCategory } from '../supabase/functions/_shared/jurisdictions.ts'
import { parseOfficialHttpsUrl } from '../supabase/functions/_shared/urlSafety.ts'

const QUERY_VALIDATION_MESSAGE =
  'Enter a research question as ordinary text between 3 and 1,000 characters. Remove HTML, scripts, event-handler markup, and javascript: or data:text/html links. Comparisons such as “under < 200 square feet” are allowed.'

function rejected(raw) {
  const result = validateResearchQuery(raw)
  assert.equal(result.ok, false)
  assert.equal(result.message, QUERY_VALIDATION_MESSAGE)
}

function accepted(raw, expected) {
  const result = validateResearchQuery(raw)
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.query, expected ?? raw.trim())
}

test('script and HTML-like questions are rejected', () => {
  rejected('<script>alert("test")</script>')
  rejected('<img src=x onerror=alert(1)>')
  rejected('javascript:alert(1)')
  rejected('Please search data:text/html,alert(1)')
  rejected('bad\u0000question')
  rejected('Look at <iframe src="https://example.com">')
})

test('legitimate building-code questions remain valid', () => {
  accepted('Is a deck under < 200 square feet exempt?')
  accepted('What does § R105.2 require?')
  accepted("Can I convert a 10' × 12' basement room?")
  accepted('Do I need a permit to replace an existing deck?')
  accepted('  Permit for a 12-foot porch?  ', 'Permit for a 12-foot porch?')
})

test('missing or non-string questions are rejected', () => {
  rejected(null)
  rejected(undefined)
  rejected(42)
  rejected({ query: 'deck permit' })
})

test('SQL and path-style strings are treated as text, not execution input', () => {
  accepted("' OR 1=1; DROP TABLE research_history; --")
  accepted('../../etc/passwd')
})

test('municipality and category values must match server allowlists', () => {
  assert.equal(getJurisdiction('not-a-city'), undefined)
  assert.ok(getJurisdiction('nyc'))
  assert.equal(isSupportedCategory('not-a-category'), false)
  assert.equal(isSupportedCategory('decks'), true)
})

test('malformed objects and deep JSON nesting are detected', () => {
  assert.equal(jsonNestingDepth({ a: 1 }), 1)
  assert.ok(jsonNestingDepth({ a: { b: { c: { d: { e: { f: { g: { h: 1 } } } } } } } }) > 6)
})

test('unsafe source URLs are rejected and official HTTPS subdomains are kept', () => {
  const nyc = ['nyc.gov']
  const deceptive = parseOfficialHttpsUrl('https://nyc.gov.attacker.com/example')
  assert.ok(deceptive)
  assert.equal(hostMatchesApprovedDomain(deceptive.hostname, nyc), false)
  assert.equal(parseOfficialHttpsUrl('http://nyc.gov/example'), null)
  assert.equal(parseOfficialHttpsUrl('javascript:alert(1)'), null)
  assert.equal(parseOfficialHttpsUrl('https://user:pass@nyc.gov/example'), null)
  const official = parseOfficialHttpsUrl('https://www.nyc.gov/site/buildings/example')
  assert.ok(official)
  assert.equal(hostMatchesApprovedDomain(official.hostname, nyc), true)
})
