# CodeTrace Testing Report

**Application:** CodeTrace — residential building-code research  
**Report date:** 4 September 2026  
**Test command:** `npm run test:security` (29 passed, 0 failed)  
**Build command:** `npm run build` (succeeded)  
**Scope:** React/Vite/TypeScript client, Supabase Anonymous Authentication, Postgres RLS, Edge Function (`search-building-code`), Tavily (server-side only)

This report consolidates feature coverage, defects that were found and fixed, security controls, and accessibility work. It is not a claim that the product is perfectly secure or that every live browser path was re-run after the latest deploy.

---

## 1. Complete list of features tested

### 1.1 Product features

| Area | Feature tested | How it was verified | Result |
| --- | --- | --- | --- |
| Startup | Shell, disclaimer, municipality/category selectors, question form, source viewer, saved research | Code-path review of `App.tsx` and `AppShell.tsx` | Pass (layout present) |
| Authentication | Anonymous session start | `ensureAnonymousSession()`; generic errors; JWT required on Edge Function | Pass (code + static test) |
| Authentication | Session failure and retry | **Try again** on auth error; no raw stack traces | Pass |
| Municipalities | Austin, NYC, Los Angeles, Chicago, Miami | Client and server allowlists; official-domain hint | Pass |
| Categories | Decks, basements, permits, zoning | Shared category IDs on client and Edge Function | Pass |
| Search context reset | Changing municipality or category | Clears question, answer, viewer, validation/feedback state; does not clear saved research | Pass (unit + static) |
| Placeholders | Sample question by city and category | Placeholder is not the input value, not counted, not submitted, not saved | Pass |
| Question input | 3–1,000 character limit | `minLength`/`maxLength`, client validation, Edge Function, DB check | Pass |
| Question input | Trim before validate | Shared `validateResearchQuery()` | Pass |
| Question input | Legitimate building-code wording | `< 200 square feet`, `§ R105.2`, apostrophes, ×, Unicode | Pass |
| Question input | Markup / protocol abuse | `<script>`, `<img onerror>`, `javascript:`, null bytes rejected; not sent to Tavily or history | Pass |
| Live search | Official-domain HTTPS only | Hostname must equal approved domain or a real subdomain; `nyc.gov.attacker.com` rejected; `http://` rejected | Pass |
| Live search | Dedup and ranking | Canonical URL, title/excerpt fingerprints; max four sources | Pass (code) |
| Live search | Case-specific vs general sources | Zoning Board PDFs rejected for general rules; allowed for explicit case/address questions | Pass |
| Live search | Numeric claim check | Tavily measurements such as “10 feet” must appear in a retained strong source | Pass |
| Answers | Useful Tavily summary | Shown only when official results remain and numeric claims check out | Pass (code + unit) |
| Answers | Insufficient information | Used when no usable official results or unsupported numbers | Pass |
| Section numbers | Explicit identifiers only | `Section AC 28-105.4`, `AC §28-401.18`, `§3300`, `Sec. R105.2`, `Section 28-105.4`; never inferred | Pass |
| Citations | Card content | Title, official/prototype badge, section or “not stated”, domain, HTTPS link, excerpt, retrieved time, View Source | Pass (code) |
| Source viewer | Selected source details | `aria-live="polite"`; HTTPS links with `noopener noreferrer` | Pass (code) |
| History | Save after search | Parameterized insert; `user_id` from `auth.uid()`; query re-validated | Pass (code) |
| History | List, refresh, reopen | Limit 50; reopen restores question/answer/citations | Pass (code) |
| History | Cross-user isolation | RLS `auth.uid() = user_id` | Pass (schema test) |
| Feedback | Helpful / Not Helpful / Report Incorrect | Allowlisted ratings; note ≤ 500 chars; owner check on `history_id` | Pass (code + schema) |
| Errors | Timeout, 429, Tavily failure, network | User message does not say no building-code requirement exists | Pass (code) |
| Prototype fallback | Missing Tavily/function | Local corpus labeled Prototype Reference; not mixed with live official results | Pass (code) |
| Responsive layout | Two-column to stacked | `lg:grid-cols-[...]` and padding breakpoints | Pass (code) |

### 1.2 Automated regression suites (`npm run test:security`)

| File | Coverage |
| --- | --- |
| `tests/security-static.test.mjs` | gitignore, JWT, request validation, HTTPS/domains, RLS, constraints, safe links, a11y hooks, no SQL/HTML sinks, Tavily endpoint, shared query validation, `.env.example` |
| `tests/security-inputs.test.mjs` | Markup rejection, valid questions, missing/non-string query, SQL/path strings as text, municipality/category allowlists, JSON depth, deceptive/http/javascript URLs vs official HTTPS subdomain |
| `tests/source-authority.test.mjs` | ZBA PDF rejection/allowance; unsupported vs supported numeric claims |
| `tests/search-context.test.mjs` | Context-change clearing; placeholders |
| `tests/stored-payload.test.mjs` | Stored citations drop `javascript:` / `http:`; malformed JSON cannot become citations; UUID check |

Latest run: **29 passed, 0 failed**.

### 1.3 Live / deployment items still requiring a human pass

These need the configured Supabase project, deployed function, and a browser:

- First-load anonymous sign-in and history fetch
- End-to-end search for each city with Tavily
- Source viewer announcement in a screen reader
- Keyboard tab order through a live session
- Viewport checks at ~375 px, 768 px, and 1,280 px
- Applying migration `20260905_history_payload_and_rls.sql` if not yet on the remote database

The Edge Function `search-building-code` was deployed to project `kluagdsomcgxojdcincw` on 4 September 2026. The Vite UI is local unless separately hosted; reload the local app to pick up client changes.

---

## 2. All bugs found and fixed

| ID | Bug | Impact | Resolution |
| --- | --- | --- | --- |
| B1 | `.gitignore` missing; `.env` and `supabase/.temp` could be shipped | Secret/metadata leak | `.gitignore` for `.env`, `.env.*`, `!.env.example`, `supabase/.temp/`, `node_modules/`, `dist/` |
| B2 | Question length not consistently enforced | Oversized or empty searches | 3–1,000 characters on UI, Edge Function, and database |
| B3 | Feedback notes unbounded | Storage / abuse | 500-character limit on UI, service, and database |
| B4 | History URLs rendered without a protocol check | `javascript:` / `http:` links | `safeHttpUrl()`; HTTPS only; no embedded credentials; `rel="noopener noreferrer"` |
| B5 | Raw service/auth errors shown to users | Information disclosure | Generic fallbacks; Edge error allowlist on the client |
| B6 | Weak Edge Function request handling | Malformed/oversized abuse | POST only, JSON content type, 20 KB body (including missing `Content-Length`), object-only JSON, nesting cap, JWT |
| B7 | Tavily excerpts stitched into an answer when Tavily supplied none | Misleading “answer” | Insufficient-information message when no official summary remains |
| B8 | Duplicate / clearly unrelated official hits | Noisy citations | URL/title/excerpt fingerprints; unrelated-marker filter; max four sources |
| B9 | Explicit section IDs missed (`Section AC 28-105.4`, `AC §28-401.18`) | `sectionNumber` was `null` | Extraction updated for `Section`/`Sec.`/`§` plus `AC` prefixes; still no inference |
| B10 | `<script>alert("test")</script>` searched and saved | Junk Tavily calls and stored markup | Shared validation rejects tags, event-handler markup, `javascript:`, `data:text/html`, control characters; comparisons like `under < 200` still allowed |
| B11 | Chicago garage zoning used Zoning Board decision PDFs and claimed a general 10-foot setback | Incorrect general rule | Case documents excluded unless the question is case-specific; numeric claims must appear in a retained strong source |
| B12 | Changing city/category left the previous question and answer | Stale, wrong-jurisdiction research | Question and result state cleared; saved research kept; contextual placeholder only |
| B13 | Stored citation JSON reloaded unsanitized | Unsafe URLs could persist in history | `sanitizeCitations()` on save and load; allowlisted municipality/category on insert |
| B14 | RLS update/delete denied only by omission | Future policy mistake could open writes | Explicit deny policies; answer length and citations-must-be-array checks (migration `20260905_history_payload_and_rls.sql`) |
| B15 | Client accepted any `VITE_SUPABASE_URL` and parsed tokens from the URL | HTTP / credentialed URL; token-in-hash risk | HTTPS required (localhost HTTP allowed); `detectSessionInUrl: false` |

---

## 3. Security measures implemented

### Secrets and configuration

- Tavily key: Edge Function secret `TAVILY_API_KEY` only; endpoint hard-coded to `https://api.tavily.com/search`
- Supabase service-role key: not in the frontend
- Anon/public key: allowed in the Vite app; authorization is RLS, not key secrecy
- `.env.example` placeholders only; `.env*` not tracked

### Authentication and database

- Anonymous Authentication preserved
- Edge Function `verify_jwt = true`
- History/feedback inserts do not accept a client `user_id` (default `auth.uid()`, `WITH CHECK (auth.uid() = user_id)`)
- Feedback insert requires the history row to belong to the same user
- Explicit RLS deny for update/delete (in schema/migration)
- Constraints: query length and markup, note length and markup, rating enum, source_mode enum, answer length, citations JSON array

### Injection and execution

- No concatenated SQL; Supabase parameterized client only
- No `eval`, `new Function`, `dangerouslySetInnerHTML`, or `innerHTML`
- SQL-like and path-like strings are stored/searched as text, not executed
- Feedback `history_id` must be a UUID

### Untrusted input

- Trim-then-validate questions on React client, search client, history save, and Edge Function
- Reject null bytes, control characters, HTML/XML-like tags, event handlers, `javascript:`, `data:text/html`
- Do not ban a lone `<` used in measurements
- Clip Tavily title/excerpt/summary/section lengths
- Sanitize stored citations (HTTPS URLs only, field caps, array shape)

### Official sources and answers

- Municipality → server-controlled approved domains (`include_domains`); user cannot supply domains, table names, or env names
- Re-validate hostnames after Tavily; reject lookalike hosts
- HTTPS only; reject credentials, `javascript:`, `data:`, `file:`
- Case-specific administrative PDFs are not treated as general code
- Unsupported numeric claims in Tavily answers are not displayed

### Transport and browser

- Edge responses: `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`
- CORS: localhost reflected; optional `ALLOWED_ORIGINS`; otherwise `*` (tighten in deployment)
- `Referrer-Policy: strict-origin-when-cross-origin`
- Vite `preview` headers: nosniff, `X-Frame-Options: DENY`, production CSP

### Tests

- 29 automated security/regression tests covering the controls above

### Residual operational risks (not fully removable in app code)

- Apply `20260905_history_payload_and_rls.sql` on the remote database if it is not applied yet
- Set `ALLOWED_ORIGINS` for strict CORS
- Gateway/Supabase rate limiting for anonymous session and Tavily quota abuse
- Tavily answer text remains untrusted (displayed as text; cannot change approved domains)

---

## 4. Accessibility features added

| Feature | Where | Purpose |
| --- | --- | --- |
| Skip link to `#main-content` | `AppShell.tsx` | Keyboard users skip the header |
| Landmark header/main | `AppShell.tsx` | Screen-reader structure |
| Page title and one `h1` | `index.html`, `AppShell` | Document name vs. product heading |
| Visible `:focus-visible` outline | `src/index.css` | High-contrast keyboard focus |
| `prefers-reduced-motion` | `src/index.css` | Limits animation/transition for vestibular sensitivity |
| Explicit labels + `htmlFor`/`id` | Question, feedback, selects | Inputs are named |
| `aria-describedby` on question and feedback | Helper text + character count | Limits explained without relying on placeholder |
| Persistent **Research question** label | `QueryForm.tsx` | Placeholder is not the only label |
| Faint placeholder only | Municipality/category samples | Hint text is not submitted or counted |
| `aria-live` on character counters | Question and feedback | Count updates announced politely |
| `aria-busy` on form and search button | Query form | Searching state exposed |
| Status vs alert | `StatusMessage.tsx` | Errors use `role="alert"` and `aria-live="assertive"`; other status is polite |
| Source viewer `aria-live="polite"` and `aria-label` | `SourceViewer.tsx` | Selection changes announced |
| History list `aria-busy` | `HistoryList.tsx` | Refresh/loading announced |
| Disabled controls during search/session | Selectors, search, feedback | Prevents duplicate actions; visual disabled styles |
| Search disabled until a valid question | `canSubmit` | Empty placeholder cannot be submitted |
| External link `aria-label` + new-tab `rel` | Citation card, source viewer | Link purpose; no tabnabbing |
| Helper copy for markup vs comparisons | Question help | Explains that `under < 200` is allowed |

Keyboard coverage intended (retest in a live browser): skip link → municipality → category → question → search → source links / View Source → feedback → history refresh/items.

---

## 5. How to re-run this report’s automated checks

```powershell
npm.cmd run test:security
npm.cmd run build
```

Optional after schema review:

```powershell
npx.cmd supabase db push --project-ref <project-ref>
npx.cmd supabase functions deploy search-building-code --project-ref <project-ref>
```
