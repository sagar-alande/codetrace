# CodeTrace Security Checklist

**Location:** `testing-report/`  
**Date:** 4 September 2026  
**Verified by:** `npm run test:security` (29 passed, 0 failed)

Items marked ✓ are implemented in the application code and/or schema. This list documents controls that are in place; it does not mean the product is immune to every attack. Operational follow-ups (CORS allowlist, gateway rate limits, applying migration `20260905_history_payload_and_rls.sql` if not already on the remote database) are listed at the end.

---

## ✓ All security measures in place

### Secrets and configuration

- [x] Tavily API key used only in the Edge Function (`Deno.env.get('TAVILY_API_KEY')`)
- [x] Tavily URL hard-coded to `https://api.tavily.com/search` (not taken from user input)
- [x] Supabase service-role key not present in the Vite client
- [x] Frontend uses the anon/public key only; authorization depends on RLS
- [x] `.env` and `.env.*` ignored by git; `.env.example` contains placeholders only
- [x] `supabase/.temp/` ignored by git
- [x] Edge Function JWT verification enabled (`verify_jwt = true`)

### Authentication and authorization

- [x] Anonymous Authentication required for search, history, and feedback
- [x] Edge Function rejects requests without a Bearer token
- [x] `user_id` is not accepted from the client; default and check use `auth.uid()`
- [x] History select/insert limited to the signed-in user
- [x] Feedback insert requires the related history row to belong to the same user
- [x] Explicit RLS deny policies for history/feedback update and delete (schema + migration `20260905`)

### Transport, browser, and execution sinks

- [x] Edge responses send `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`
- [x] Official source links require HTTPS, reject credentials, and open with `rel="noopener noreferrer"`
- [x] Hostnames must match an approved domain or a real subdomain (`nyc.gov.attacker.com` rejected)
- [x] No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `new Function` in app UI/services
- [x] No user input concatenated into SQL; inserts/selects use the Supabase client
- [x] No user input passed to shell, file paths, or dynamic imports
- [x] `Referrer-Policy: strict-origin-when-cross-origin` on the HTML page
- [x] Vite `preview` headers: nosniff, `X-Frame-Options: DENY`, production CSP
- [x] Client Supabase URL must be HTTPS (HTTP allowed only for localhost)
- [x] `detectSessionInUrl` disabled so auth tokens are not taken from the page URL

### Official-source integrity

- [x] Municipality mapped to server-controlled approved domains
- [x] User cannot supply official domains, Tavily endpoint, table names, or env-var names
- [x] Tavily results re-validated after fetch
- [x] Case-specific Zoning Board/agenda/decision documents excluded from general-rule questions
- [x] Numeric claims in Tavily answers must appear in a retained strong source
- [x] Tavily title, excerpt, summary, URL, and section fields length-capped

---

## ✓ Data protection methods

| Method | What it protects |
| --- | --- |
| ✓ Row Level Security | One user cannot read, update, or delete another user’s history or feedback |
| ✓ `auth.uid()` ownership | Rows are bound to the anonymous session user |
| ✓ Parameterized Supabase API | Question and note text cannot become SQL |
| ✓ Field allowlists | Municipality, category, rating, and `source_mode` cannot be arbitrary server identifiers |
| ✓ Stored-payload sanitization | History citations are HTTPS-only, size-capped, and must be an array |
| ✓ Answer clipping | Stored `answer_text` capped at 4,000 characters |
| ✓ Database check constraints | Query 3–1,000 chars; note ≤ 500; ratings enum; markup/control-character checks |
| ✓ Citations JSON array constraint | `citations` must be a JSON array (schema + migration `20260905`) |
| ✓ React text rendering | Questions, answers, excerpts, domains, and errors display as text, not HTML |
| ✓ `safeHttpUrl()` on render | Stored `javascript:` / `http:` / credentialed URLs are not used as `href` |
| ✓ History limit 50 | List query cannot unbounded-dump the table for one user |
| ✓ Tavily response size cap | Upstream body limited to 1 MB before parse |
| ✓ Request body size cap | Edge Function rejects bodies over 20 KB |
| ✓ `no-store` on research responses | Browsers/CDNs instructed not to cache research payloads |

**Data that is intentionally stored:** trimmed research question, generated summary, sanitized citations, municipality/category labels, feedback rating and optional note. **Data that is not stored in the client bundle:** Tavily secret, service-role key.

---

## ✓ Input validation rules

Applied on the React client **and** the Edge Function unless noted. Rejected questions are not sent to Tavily and are not saved.

### Research question

| Rule | Enforced |
| --- | --- |
| ✓ Value must be a string | Client + Edge Function |
| ✓ Trim before length and markup checks | Shared `validateResearchQuery()` |
| ✓ Length 3–1,000 after trim | UI `minLength`/`maxLength`, shared validator, database |
| ✓ No null bytes or disallowed control characters | Shared validator + DB |
| ✓ No HTML/XML-like tags (`<script>`, `<img …>`) | Shared validator + DB (`<[A-Za-z]`) |
| ✓ No event-handler markup (`onerror=`, etc.) | Shared validator |
| ✓ No `javascript:` / `vbscript:` | Shared validator + DB |
| ✓ No `data:text/html` | Shared validator + DB |
| ✓ Comparisons such as `under < 200 square feet` allowed | No broad ban on `<` |
| ✓ Unicode, quotes, apostrophes, hyphens, `§`, measurements allowed | Validator tests |
| ✓ Search button disabled until the question validates | `canSubmit` |
| ✓ Placeholder text is not the value, not counted, not submitted, not saved | `searchContext` |

### Municipality, category, and request body (Edge Function)

| Rule | Enforced |
| --- | --- |
| ✓ HTTP method POST only (OPTIONS for CORS) | Edge Function |
| ✓ `Content-Type` must include `application/json` | Edge Function |
| ✓ Body ≤ 20 KB (`Content-Length` and actual body) | Edge Function |
| ✓ JSON must parse; arrays, `null`, and non-objects rejected | Edge Function |
| ✓ JSON nesting depth capped | Edge Function |
| ✓ `municipalityId` must match server jurisdiction allowlist | Edge Function + history save |
| ✓ `categoryId` must match `decks` / `basements` / `permits` / `zoning` | Edge Function + history save |
| ✓ Extra client fields ignored; cannot set Tavily domains or keys | Edge Function |

### Feedback

| Rule | Enforced |
| --- | --- |
| ✓ Rating only `helpful`, `not_helpful`, `report_incorrect` | Service + database |
| ✓ Optional note trimmed; empty → `null` | Service |
| ✓ Note ≤ 500 characters | UI, service, database |
| ✓ Same markup/control-character rules as questions | Shared `validateFeedbackNote()` + DB |
| ✓ `history_id` must be a UUID | Service |
| ✓ `history_id` must belong to the current user | RLS |

### URLs and stored citations

| Rule | Enforced |
| --- | --- |
| ✓ Parse with the `URL` API | Client + Edge Function |
| ✓ Scheme `https:` only for official/source links | Both |
| ✓ Reject username/password in the URL | Both |
| ✓ Hostname allowlist (exact or subdomain of approved domain) | Edge Function |
| ✓ Max four citations; title/excerpt/section clipped | Stored payload + Edge Function |
| ✓ Non-array citation JSON discarded | `sanitizeCitations()` |

---

## ✓ Error handling coverage

User-facing copy is generic. Unknown `Error.message` values are not shown (`toErrorMessage` always uses a fallback). Search failures do **not** claim that no building-code requirement exists.

| Situation | User-visible handling | HTTP / code (server) |
| --- | --- | --- |
| ✓ Wrong HTTP method | POST required | 405 `INVALID_REQUEST` |
| ✓ Wrong content type | JSON required | 415 `INVALID_REQUEST` |
| ✓ Body too large | Request too large | 413 `INVALID_REQUEST` |
| ✓ Malformed JSON / array / null / deep object | Invalid JSON body | 400 `INVALID_REQUEST` |
| ✓ Missing/non-string/invalid question | Validation message (markup/length) | 400 `INVALID_QUERY` |
| ✓ Unknown municipality | Municipality not supported | 400 `INVALID_MUNICIPALITY` |
| ✓ Unknown category | Category not supported | 400 `UNSUPPORTED_CATEGORY` |
| ✓ Missing session | Signed-in session required | 401 `UNAUTHORIZED` |
| ✓ Tavily not configured | Search not configured on the server | 500 `MISSING_TAVILY_KEY` (client may use prototype demo) |
| ✓ Tavily HTTP 429 | Rate-limited; try again; not “no requirement” | 429 `RATE_LIMIT` |
| ✓ Tavily timeout | Timed out; not “no requirement” | 504 `TIMEOUT` |
| ✓ Tavily/upstream failure or huge/invalid response | Search failed; not “no requirement” | 502 `TAVILY_ERROR` |
| ✓ Client network/function error | Generic search failure; not “no requirement” | Mapped in `searchOfficial.ts` |
| ✓ No official results or unsupported numeric claim | Insufficient-information answer | 200 with `summary: null` / fallback mode |
| ✓ History save failure | Generic save error + retry | Client catch; no raw PostgREST text |
| ✓ History load failure | Generic load error + retry | Client catch |
| ✓ Feedback save failure | Generic feedback error | Client catch |
| ✓ Auth/session failure | Generic session error + Try again | Client catch |
| ✓ Unexpected React render error | Error boundary: reload; no stack trace | `ErrorBoundary` |
| ✓ Edge Function uncaught fetch error | Generic Tavily/search failure | 502 |

Client mapping uses a **fixed allowlist** of Edge Function codes (`INVALID_QUERY`, `RATE_LIMIT`, `TIMEOUT`, etc.). Unknown codes get a generic message.

---

## Operational follow-ups (not code checkboxes)

- [ ] Confirm migration `20260905_history_payload_and_rls.sql` is applied on the hosted database
- [ ] Set Edge Function `ALLOWED_ORIGINS` to the production site (until then CORS may remain `*`)
- [ ] Add gateway or Supabase-level rate limiting if anonymous Tavily quota abuse is a concern
- [ ] Redeploy/reload the Vite app wherever the UI is hosted so client sanitization and headers are live
