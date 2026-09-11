import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  GENERIC_QUESTION_PLACEHOLDER,
  clearedResearchDraft,
  sampleQuestionPlaceholder,
  sampleQuestions,
} from '../src/services/searchContext.ts'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('changing municipality or category clears stale question and result data', async () => {
  const cleared = clearedResearchDraft()
  assert.equal(cleared.query, '')
  assert.equal(cleared.answer, null)
  assert.equal(cleared.viewingCitation, null)
  assert.equal(cleared.historyId, null)
  assert.equal(cleared.searchError, null)
  assert.equal(cleared.feedbackError, null)
  assert.equal(cleared.feedbackSuccess, null)

  const hook = await read('src/hooks/useResearch.ts')
  assert.match(hook, /function changeMunicipality/)
  assert.match(hook, /function changeCategory/)
  assert.match(hook, /resetAnswerState\(\)/)
  assert.match(hook, /clearedResearchDraft/)
  assert.match(hook, /setQuery\(cleared\.query\)/)
  assert.doesNotMatch(hook, /setHistory\(\[\]\)/)
})

test('placeholders follow municipality and category and never become input values', () => {
  const chicagoZoning = sampleQuestionPlaceholder('chicago', 'zoning')
  const nycDecks = sampleQuestionPlaceholder('nyc', 'decks')
  assert.match(chicagoZoning, /Chicago/)
  assert.match(chicagoZoning, /garage|setback/i)
  assert.match(nycDecks, /New York City/)
  assert.notEqual(chicagoZoning, nycDecks)
  assert.equal(sampleQuestionPlaceholder('', ''), GENERIC_QUESTION_PLACEHOLDER)
  assert.notEqual(clearedResearchDraft().query, chicagoZoning)
})

test('sample questions require both a jurisdiction and a category', () => {
  assert.deepEqual(sampleQuestions('', ''), [])
  assert.deepEqual(sampleQuestions('austin', ''), [])
  assert.deepEqual(sampleQuestions('', 'decks'), [])
  assert.deepEqual(sampleQuestions('unknown', 'decks'), [])

  const austinDecks = sampleQuestions('austin', 'decks')
  assert.ok(austinDecks.length >= 3)
  for (const question of austinDecks) {
    assert.match(question, /Austin/)
    assert.doesNotMatch(question, /%CITY%/)
  }
  assert.notDeepEqual(sampleQuestions('nyc', 'decks'), austinDecks)
})
