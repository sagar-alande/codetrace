import assert from 'node:assert/strict'
import test from 'node:test'
import { isUuid, sanitizeCitations } from '../src/services/storedPayload.ts'
import { safeHttpUrl } from '../src/services/text.ts'

test('stored citations drop javascript and non-https URLs', () => {
  const citations = sanitizeCitations([
    {
      recordId: '1',
      title: 'Official garage guide',
      excerpt: 'Detached garages must observe a 10 feet rear setback.',
      sourceStatus: 'official',
      url: 'javascript:alert(1)',
      domain: 'chicago.gov',
    },
    {
      recordId: '2',
      title: 'HTTPS source',
      excerpt: 'Permit guidance for accessory buildings.',
      sourceStatus: 'official',
      url: 'https://www.chicago.gov/garage',
      domain: 'www.chicago.gov',
    },
    {
      recordId: '3',
      title: 'Not an array item shape',
      excerpt: 'ignored because url is http',
      sourceStatus: 'official',
      url: 'http://chicago.gov/example',
    },
  ])

  assert.equal(citations.length, 3)
  assert.equal(citations[0].url, undefined)
  assert.equal(citations[1].url, 'https://www.chicago.gov/garage')
  assert.equal(citations[2].url, undefined)
  assert.equal(safeHttpUrl('javascript:alert(1)'), null)
})

test('malformed citation payloads cannot become stored objects', () => {
  assert.deepEqual(sanitizeCitations({ title: 'nope' }), [])
  assert.deepEqual(sanitizeCitations('sql-injection'), [])
  assert.equal(isUuid('not-a-uuid'), false)
  assert.equal(isUuid('2c0b1c7a-6d3e-4a21-9b8f-1a2b3c4d5e6f'), true)
})
