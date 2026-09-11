# Authentication setup

The app now shows a **login page** before the research workspace with two choices:

| Choice | What it does |
| --- | --- |
| **Sign in with Google** | Supabase Google OAuth. The user is stored in `auth.users` and mirrored into `public.profiles`. History and feedback follow the account across devices. |
| **Continue as guest** | Supabase anonymous sign-in. Works fully, but the notice warns that guest research "might not be saved" — it lives only in that browser's Supabase session and is not reachable from another device or after clearing site data. |

Signed-in users see only their own rows (enforced by the existing `research_history` / `feedback` RLS policies, which key on `auth.uid() = user_id`).

## 1. Enable providers (Supabase dashboard)

- **Authentication → Providers → Google**: enable, then paste the Client ID and Client Secret from a Google Cloud OAuth 2.0 "Web application" client.
  - In Google Cloud, add the authorized redirect URI shown on that Supabase page (looks like `https://<project-ref>.supabase.co/auth/v1/callback`).
- **Authentication → Providers → Anonymous Sign-ins**: enable (used by "Continue as guest").
- **Authentication → URL Configuration**: set **Site URL** and add every app origin to **Redirect URLs**, e.g.
  - `http://localhost:5173`
  - your deployed URL

The client calls `signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`, so the app origin must be allow-listed.

## 2. Apply the database migration

Run `supabase/migrations/20260909_profiles_and_auth.sql` (SQL editor or `supabase db push`). It creates `public.profiles`, RLS policies, and triggers on `auth.users` that keep `profiles` in sync on sign-up and profile updates, plus a one-time backfill.

No changes are needed to `research_history` or `feedback` — they already scope by `user_id` and default it to `auth.uid()`.

## 3. Environment

No new variables. Still just:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

`src/services/supabaseClient.ts` now sets `detectSessionInUrl: true` and `flowType: 'pkce'` so the Google redirect completes.

## Notes / limits

- Guest → Google **does not merge history**. They are different `user_id`s; anything saved as a guest stays under the anonymous user.
- The edge function `search-building-code` has `verify_jwt = true`. Both Google and guest sessions carry a valid JWT, so search works for both.
