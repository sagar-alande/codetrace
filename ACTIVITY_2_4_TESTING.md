# CodeTrace Activity 2.4 Testing Record

## Test basis

The uploaded project was reviewed file by file. Ten automated static security and accessibility checks passed through `npm run test:security`. The final connected browser checks are intentionally marked **Retest after deployment** because the ZIP correctly omitted Supabase credentials and the Tavily server secret.

Status meanings:

- **Pass:** verified by automated test or direct code-path inspection.
- **Retest after deployment:** requires the configured Supabase project, deployed Edge Function, or live browser viewport.

## Comprehensive feature checklist

| Area | Test | Expected result | Status |
| --- | --- | --- | --- |
| Startup | Load the application | Header, disclaimer, selectors, question form, source viewer, and history render without a crash | Retest after deployment |
| Authentication | Start with no existing session | Supabase creates an anonymous session and loads only that user's history | Retest after deployment |
| Authentication | Session failure and retry | A helpful message and working **Try again** button appear; no raw service error is exposed | Pass |
| Municipality | Test Austin, NYC, Los Angeles, Chicago, and Miami | Each option can be selected and shows its configured official domain | Pass |
| Category | Test decks, basements, permits, and zoning | Each category can be selected | Pass |
| State reset | Change municipality or category after a result | Previous answer, selected citation, feedback state, and save error are cleared | Pass |
| Question | Submit a normal question | Search begins once; loading state disables duplicate submission | Retest after deployment |
| Question | Submit blank or whitespace-only text | Search is blocked and a helpful validation message is available | Pass |
| Question | Enter fewer than 3 characters | Browser and server validation reject it | Pass |
| Question | Enter more than 1,000 characters | The textarea prevents excess text; the server and database also reject oversized input | Pass |
| Question | Enter punctuation, Unicode, quotes, or HTML-like text | Input remains text and cannot become executable markup or a database query | Pass |
| Live search | Search each municipality | Only HTTPS results from the selected city's server-side domain allowlist are retained | Pass |
| Live search | Receive duplicate or weakly related results | Duplicate titles/excerpts/URLs and clearly unrelated results are removed; no more than four sources remain | Pass |
| Answer | Tavily returns a useful generated answer | A concise answer appears above numbered supporting-source markers | Retest after deployment |
| Answer | Tavily returns no answer or no useful official results | The existing insufficient-information message appears instead of stitched excerpts | Pass |
| Answer | Source contains an explicit section identifier | The section is shown only when `Section`, `Sec.`, or `§` is present in retrieved text | Pass |
| Error handling | Simulate offline, timeout, rate limit, or API failure | The app shows a helpful message and does not imply that no code requirement exists | Retest after deployment |
| Source cards | Inspect each card | Title, badge, domain, safe URL, excerpt, retrieval time, and **View Source** are shown | Pass |
| Source links | Attempt a non-HTTPS stored link | The unsafe link is not rendered as a clickable URL | Pass |
| Source viewer | Activate **View Source** | Selected source details update and are announced politely to assistive technology | Retest after deployment |
| History | Complete a successful search | The result saves under the anonymous user's ID | Retest after deployment |
| History | Refresh and reopen a saved item | History reloads; reopening restores the question, answer, citations, and selected source | Retest after deployment |
| History security | Attempt cross-user access | RLS blocks selecting or inserting another user's research | Pass |
| Feedback | Test Helpful, Not Helpful, and Report Incorrect | Each valid rating saves only for research owned by the current user | Retest after deployment |
| Feedback | Test empty, normal, and 500-character notes | Valid notes save; the control displays its current limit | Retest after deployment |
| Feedback | Attempt a note over 500 characters | Client, service, and database limits reject it | Pass |
| Keyboard | Navigate from the top using Tab/Shift+Tab | Skip link, selectors, question, search, details, source links, feedback, refresh, and history are reachable | Retest after deployment |
| Focus | Move through interactive controls | A high-contrast visible focus outline remains present | Pass |
| Screen reader | Trigger loading, success, and error states | Status and alert regions announce changes; labels and helper text identify inputs | Pass |
| Responsive | Test approximately 375 px, 768 px, and 1,280 px widths | Content remains readable; the two-column layout collapses without horizontal clipping | Retest after deployment |

## Bugs and vulnerabilities found and resolved

1. **Secret and metadata exposure risk:** The project had no `.gitignore`, and Supabase CLI `.temp` metadata was present in the uploaded archive. A `.gitignore` now excludes environment files, dependencies, builds, logs, and `supabase/.temp/`. The corrected ZIP omits that directory.
2. **Unbounded feedback and incomplete query validation:** The question now enforces 3–1,000 characters. Feedback notes enforce 500 characters. Equivalent checks exist in the Edge Function/service and database constraints.
3. **Unsafe stored-link rendering:** Source URLs loaded from history were rendered directly. Both source components now allow only valid HTTPS URLs before creating links.
4. **Internal error disclosure:** Raw authentication, database, function, and render-error messages could reach users. User-facing messages are now generic and actionable.
5. **Weak request hardening:** The Edge Function now rejects non-POST requests, non-JSON requests, oversized bodies, unsupported municipalities/categories, invalid question lengths, missing authentication, and non-HTTPS sources. Responses use `no-store` and `nosniff` headers.
6. **Misleading answer fallback:** When Tavily supplied no generated answer, CodeTrace joined source excerpts into an apparent answer. It now uses the insufficient-information state instead.
7. **Duplicate and unrelated results:** URL, title, and excerpt fingerprints improve deduplication. Topic-aware ranking reduces unrelated pages while preserving high-confidence official results.
8. **Keyboard and screen-reader gaps:** A skip link, global visible focus treatment, explicit input IDs, helper associations, character counters, live regions, safer external-link labels, and reduced-motion support were added.

## Security checklist

- [x] Tavily secret remains server-side.
- [x] `.env*` and Supabase CLI metadata are excluded from version control.
- [x] Edge Function JWT verification is enabled.
- [x] Municipality and category allowlists are enforced on the server.
- [x] Only approved-domain HTTPS source URLs are accepted.
- [x] Request method, content type, body size, and question length are validated.
- [x] React text escaping and safe-link protocol validation reduce XSS risk.
- [x] Supabase queries use the client library rather than concatenated SQL.
- [x] RLS restricts history and feedback to the current authenticated user.
- [x] Database constraints enforce query, feedback, rating, and source-mode values.
- [x] Research responses are marked `no-store`; raw internal errors are hidden.
- [x] React 19.2.8 and Vite 8.2.2 are beyond the patched versions listed in the reviewed [React](https://github.com/react/react/security/advisories/GHSA-wx67-qw84-cm4g) and [Vite](https://github.com/vitejs/vite/security/advisories/GHSA-fx2h-pf6j-xcff) advisories. CodeTrace does not use React Server Components.

## Final connected validation commands

```powershell
npm.cmd install
npm.cmd run test:security
npm.cmd run build
npx.cmd supabase functions deploy search-building-code
```

Apply the updated `supabase/schema.sql` in the Supabase SQL editor before recording the final video. Then execute every item marked **Retest after deployment** and record the result.
