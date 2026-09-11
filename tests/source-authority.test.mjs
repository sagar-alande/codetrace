import assert from 'node:assert/strict'
import test from 'node:test'
import {
  numericClaimsSupported,
  shouldRetainSourceForQuery,
  tavilyAnswerIsDisplayable,
} from '../supabase/functions/_shared/sourceAuthority.ts'

const GENERAL_QUERY = 'What zoning setback rules apply to a detached garage in Chicago?'
const CASE_QUERY =
  'What did the Chicago Zoning Board of Appeals decide for the garage at 123 N Wells Street?'
const ZBA_TITLE = 'Zoning Board of Appeals Decision — 123 N Wells Street'
const ZBA_URL =
  'https://www.chicago.gov/content/dam/city/depts/zlup/Zoning_Board_of_Appeals/2024-03-15-decision.pdf'
const CODE_TITLE = 'Chicago Zoning Ordinance — accessory buildings and setbacks'
const CODE_URL = 'https://www.chicago.gov/city/en/depts/dcd/supp_info/zoning.html'

test('Zoning Board decision PDFs are rejected for general-rule questions', () => {
  assert.equal(shouldRetainSourceForQuery(GENERAL_QUERY, ZBA_TITLE, ZBA_URL), false)
})

test('Zoning Board decision PDFs are allowed for explicitly case-specific questions', () => {
  assert.equal(shouldRetainSourceForQuery(CASE_QUERY, ZBA_TITLE, ZBA_URL), true)
})

test('an answer with an unsupported numeric requirement is rejected', () => {
  const answer = 'A detached garage typically requires a 10-foot rear setback. [1]'
  const sources = [
    {
      title: CODE_TITLE,
      url: CODE_URL,
      excerpt: 'Accessory buildings are subject to the applicable rear setback of the zoning district.',
    },
  ]
  assert.equal(numericClaimsSupported(answer, sources), false)
  assert.equal(tavilyAnswerIsDisplayable(answer, sources, GENERAL_QUERY), false)
})

test('a numeric requirement explicitly found in a retained strong source is accepted', () => {
  const answer = 'A detached garage typically requires a 10-foot rear setback. [1][2]'
  const sources = [
    {
      title: CODE_TITLE,
      url: CODE_URL,
      excerpt: 'Detached garages must observe a 10 feet rear setback in this district.',
    },
  ]
  assert.equal(numericClaimsSupported(answer, sources), true)
  assert.equal(tavilyAnswerIsDisplayable(answer, sources, GENERAL_QUERY), true)
})
