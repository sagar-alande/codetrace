import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function isAllowedSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.username || parsed.password) return false
    if (parsed.protocol === 'https:') return true
    return (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
    )
  } catch {
    return false
  }
}

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return Boolean(
    url &&
      key &&
      !url.includes('your-supabase-project-url') &&
      !key.includes('your-supabase-anon-public-key') &&
      isAllowedSupabaseUrl(url),
  )
}

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // Needed so the Google OAuth redirect callback (tokens in the URL)
          // is consumed and exchanged for a session on return to the app.
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      },
    )
  }
  return client
}
