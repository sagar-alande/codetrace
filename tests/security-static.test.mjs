import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('local secrets and Supabase CLI metadata are ignored', async () => {
  const gitignore = await read('.gitignore')
  for (const required of ['.env', '.env.*', '!.env.example', 'supabase/.temp/']) {
    assert.match(gitignore, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('Edge Function requires JWT verification', async () => {
  const config = await read('supabase/config.toml')
  assert.match(config, /verify_jwt\s*=\s*true/)
})

test('Edge Function validates method, JSON, size, and query length', async () => {
  const source = await read('supabase/functions/search-building-code/index.ts')
  const validation = await read('supabase/functions/_shared/inputValidation.ts')
  assert.match(source, /req\.method !== 'POST'/)
  assert.match(source, /application\/json/)
  assert.match(source, /MAX_REQUEST_BYTES/)
  assert.match(source, /rawBody\.length > MAX_REQUEST_BYTES/)
  assert.match(source, /JSON\.parse\(rawBody\)/)
  assert.match(source, /Array\.isArray\(parsed\)/)
  assert.match(source, /validateResearchQuery/)
  assert.match(validation, /query\.length < 3 \|\| query\.length > 1000/)
})

test('official-source URLs require HTTPS, no credentials, and approved domains', async () => {
  const source = await read('supabase/functions/search-building-code/index.ts')
  const urls = await read('supabase/functions/_shared/urlSafety.ts')
  assert.match(urls, /url\.protocol !== 'https:'/)
  assert.match(urls, /url\.username \|\| url\.password/)
  assert.match(source, /hostMatchesApprovedDomain\(hostname, approvedDomains\)/)
  assert.match(source, /parseOfficialHttpsUrl/)
})

test('database row-level security and ownership checks are present', async () => {
  const schema = await read('supabase/schema.sql')
  assert.match(schema, /research_history enable row level security/)
  assert.match(schema, /feedback enable row level security/)
  assert.match(schema, /auth\.uid\(\) = user_id/)
  assert.match(schema, /h\.user_id = auth\.uid\(\)/)
})

test('database constraints enforce input boundaries', async () => {
  const schema = await read('supabase/schema.sql')
  assert.match(schema, /between 3 and 1000/)
  assert.match(schema, /char_length\(note\) <= 500/)
  assert.match(schema, /insufficient_official/)
  assert.match(schema, /research_history_query_no_markup/)
  assert.match(schema, /research_history_update_none/)
  assert.match(schema, /using \(false\)/)
  assert.match(schema, /research_history_citations_array/)
})

test('rendered source links pass through a protocol allowlist', async () => {
  const helper = await read('src/services/text.ts')
  const card = await read('src/components/CitationCard.tsx')
  const viewer = await read('src/components/SourceViewer.tsx')
  assert.match(helper, /url\.protocol !== 'https:'/)
  assert.match(helper, /url\.username \|\| url\.password/)
  assert.match(card, /safeHttpUrl\(citation\.url\)/)
  assert.match(viewer, /safeHttpUrl\(citation\.url\)/)
  assert.match(card, /rel="noopener noreferrer"/)
  assert.match(viewer, /rel="noopener noreferrer"/)
})

test('query and feedback controls expose accessible limits', async () => {
  const query = await read('src/components/QueryForm.tsx')
  const feedback = await read('src/components/FeedbackBar.tsx')
  assert.match(query, /maxLength=\{MAX_QUERY_LENGTH\}/)
  assert.match(query, /aria-describedby=/)
  assert.match(feedback, /maxLength=\{MAX_NOTE_LENGTH\}/)
  assert.match(feedback, /aria-describedby=/)
})

test('the page includes a keyboard skip link and visible focus styling', async () => {
  const shell = await read('src/components/AppShell.tsx')
  const css = await read('src/index.css')
  assert.match(shell, /href="#main-content"/)
  assert.match(css, /:focus-visible/)
})

test('missing generated answers use the insufficient-information state', async () => {
  const client = await read('src/services/answer.ts')
  const edge = await read('supabase/functions/search-building-code/index.ts')
  assert.match(client, /results\.length === 0 \|\| !tavilyAnswer\?\.trim\(\)/)
  assert.match(edge, /results\.length === 0 \|\| !tavilyAnswer\?\.trim\(\)/)
})

test('user input is not concatenated into SQL, shells, eval, or HTML sinks', async () => {
  const edge = await read('supabase/functions/search-building-code/index.ts')
  const history = await read('src/services/history.ts')
  const feedback = await read('src/services/feedback.ts')
  const components = [
    await read('src/components/AnswerPanel.tsx'),
    await read('src/components/CitationCard.tsx'),
    await read('src/components/HistoryList.tsx'),
    await read('src/components/SourceViewer.tsx'),
    await read('src/App.tsx'),
  ].join('\n')

  assert.doesNotMatch(edge, /eval\s*\(/)
  assert.doesNotMatch(edge, /new Function/)
  assert.doesNotMatch(edge, /Deno\.(run|Command|readFile)/)
  assert.doesNotMatch(history, /\$\{[^}]*query/)
  assert.match(history, /\.from\('research_history'\)/)
  assert.match(history, /sanitizeCitations/)
  assert.match(feedback, /isUuid/)
  assert.doesNotMatch(components, /dangerouslySetInnerHTML/)
  assert.doesNotMatch(components, /innerHTML/)
})

test('Tavily endpoint and domains stay server-controlled', async () => {
  const edge = await read('supabase/functions/search-building-code/index.ts')
  assert.match(edge, /const TAVILY_URL = 'https:\/\/api\.tavily\.com\/search'/)
  assert.match(edge, /include_domains: approvedDomains/)
  assert.match(edge, /TAVILY_TIMEOUT_MS/)
  assert.doesNotMatch(edge, /console\.(log|debug|info)/)
})

test('client and Edge Function share research-question validation', async () => {
  const hook = await read('src/hooks/useResearch.ts')
  const search = await read('src/services/searchOfficial.ts')
  const history = await read('src/services/history.ts')
  const edge = await read('supabase/functions/search-building-code/index.ts')
  assert.match(hook, /validateResearchQuery/)
  assert.match(search, /validateResearchQuery/)
  assert.match(history, /validateResearchQuery/)
  assert.match(edge, /validateResearchQuery/)
})

test('.env.example contains placeholders only', async () => {
  const example = await read('.env.example')
  assert.match(example, /your-supabase-project-url/)
  assert.match(example, /your-supabase-anon-public-key/)
  assert.doesNotMatch(example, /service_role/)
  assert.doesNotMatch(example, /TAVILY_API_KEY\s*=\s*[^\s]/)
})
