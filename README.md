# CodeTrace

**CodeTrace** is a residential building-code research tool. It searches official municipal websites for a selected U.S. city and topic, then shows a concise answer with supporting official sources.

It is a research and reference aid only. It does not certify code compliance, approve permits, or replace inspectors, engineers, architects, or municipal authorities.

Supported jurisdictions: City of Austin, New York City, City of Los Angeles, City of Chicago, and City of Miami. Live search is limited to each city’s approved government domains. The Tavily API key stays on the server.

---

## Files

### Root

| File | Purpose |
| --- | --- |
| `index.html` | HTML entry page that mounts the React app. |
| `package.json` | Project name, npm scripts, and dependencies. |
| `package-lock.json` | Locked dependency versions. |
| `vite.config.ts` | Vite bundler configuration. |
| `tsconfig.json` | Root TypeScript project references. |
| `tsconfig.app.json` | TypeScript settings for the React app. |
| `tsconfig.node.json` | TypeScript settings for Vite/Node config files. |
| `tailwind.config.js` | Tailwind CSS theme and content paths. |
| `postcss.config.js` | PostCSS pipeline (Tailwind and Autoprefixer). |
| `.env.example` | Template for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. |
| `.env.local` | Local secrets (not committed). Client Supabase credentials only. |
| `.gitignore` | Excludes dependencies, builds, local environment files, logs, and Supabase CLI metadata. |
| `README.md` | This documentation. |

### Public assets

| File | Purpose |
| --- | --- |
| `public/favicon.svg` | Browser tab icon. |
| `public/icons.svg` | Shared SVG icon sprite. |

### Application entry

| File | Purpose |
| --- | --- |
| `src/main.tsx` | React bootstrap; wraps the app in `ErrorBoundary`. |
| `src/App.tsx` | Main layout: search form, answer, feedback, source viewer, and history. |
| `src/index.css` | Global styles and Tailwind imports. |
| `src/vite-env.d.ts` | Vite/TypeScript environment type declarations. |

### UI components

| File | Purpose |
| --- | --- |
| `src/components/AppShell.tsx` | Page header and overall page frame. |
| `src/components/DisclaimerBanner.tsx` | Legal/research-only disclaimer. |
| `src/components/MunicipalitySelect.tsx` | City selector and approved-domain hint. |
| `src/components/CategorySelect.tsx` | Research category selector. |
| `src/components/QueryForm.tsx` | Question textarea and search button, including search loading state. |
| `src/components/AnswerPanel.tsx` | Answer summary, disclaimer, and supporting official sources. |
| `src/components/CitationCard.tsx` | One official (or prototype) source card. |
| `src/components/SourceViewer.tsx` | Side panel for inspecting a selected source. |
| `src/components/SourceStatusBadge.tsx` | Official Source / Prototype Reference badge. |
| `src/components/HowGeneratedPanel.tsx` | Explains how live answers and domain checks work. |
| `src/components/HistoryList.tsx` | Saved research list, refresh, and reopen. |
| `src/components/FeedbackBar.tsx` | Helpful / not helpful / report-incorrect feedback. |
| `src/components/StatusMessage.tsx` | Loading, error, success, and empty-state messages. |
| `src/components/ErrorBoundary.tsx` | Catches unexpected render errors and offers reload. |

### App logic

| File | Purpose |
| --- | --- |
| `src/hooks/useResearch.ts` | Session, search, save, history, feedback, and loading/error state. |
| `src/types/research.ts` | Shared TypeScript types for answers, citations, history, and search results. |

### Client services

| File | Purpose |
| --- | --- |
| `src/services/supabaseClient.ts` | Creates the browser Supabase client from Vite env vars. |
| `src/services/auth.ts` | Anonymous sign-in for RLS-backed history and feedback. |
| `src/services/searchOfficial.ts` | Calls the `search-building-code` Edge Function. |
| `src/services/answer.ts` | Builds the displayed answer, citations, and insufficient-information fallback. |
| `src/services/history.ts` | Saves and loads research history in Supabase. |
| `src/services/feedback.ts` | Saves user feedback in Supabase. |
| `src/services/retrieval.ts` | Local prototype-corpus retrieval used only as demo fallback. |
| `src/services/text.ts` | Text helpers (tokenization and error-message formatting). |

### Static data

| File | Purpose |
| --- | --- |
| `src/data/municipalities.ts` | The five supported cities. |
| `src/data/categories.ts` | Research categories (decks, basements, permits, zoning). |
| `src/data/jurisdictions.ts` | Client copy of approved domains per city. |
| `src/data/corpus.ts` | Local sample records for prototype demo fallback. |

### Other `src` assets

| File | Purpose |
| --- | --- |
| `src/assets/vite.svg` | Default Vite logo (unused by the product UI). |
| `src/assets/react.svg` | Default React logo (unused by the product UI). |

### Supabase

| File | Purpose |
| --- | --- |
| `supabase/config.toml` | Local/CLI Supabase project configuration. |
| `supabase/schema.sql` | `research_history` and `feedback` tables plus RLS policies. |
| `supabase/functions/_shared/jurisdictions.ts` | Server-side city allowlists, category search hints, and domain matching. |
| `supabase/functions/search-building-code/index.ts` | Live Tavily search, domain validation, source ranking, section-number extraction, and summary payload. |

`TAVILY_API_KEY` is stored as a Supabase Edge Function secret, not in the Vite client.

## Security and validation controls

- The Edge Function requires a verified Supabase JWT and accepts only POST JSON requests.
- Municipality and category identifiers are checked against server-side allowlists.
- Questions are limited to 3–1,000 characters; feedback notes are limited to 500 characters.
- Tavily results are accepted only from HTTPS URLs on the selected municipality's approved domains.
- React escapes displayed source text, and stored source links are limited to HTTPS URLs before rendering.
- Research history and feedback use row-level security so authenticated users can access only their own data.
- Responses containing research data are marked `no-store`, and raw service errors are not displayed to users.
- `.env*` files and `supabase/.temp/` are excluded from version control.
