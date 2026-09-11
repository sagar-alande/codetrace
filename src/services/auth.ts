import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from './supabaseClient'
import { toErrorMessage } from './text'

export type AccountUser = {
  id: string
  email: string | null
  name: string | null
  avatarUrl: string | null
  isGuest: boolean
}

const SUPABASE_NOT_CONFIGURED =
  'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.'

function isGuestUser(user: User): boolean {
  if (user.is_anonymous) return true
  const provider = user.app_metadata?.provider
  return provider === 'anonymous' || !provider
}

export function toAccountUser(user: User): AccountUser {
  const metadata = user.user_metadata ?? {}
  return {
    id: user.id,
    email: user.email ?? null,
    name:
      (metadata.full_name as string | undefined) ??
      (metadata.name as string | undefined) ??
      null,
    avatarUrl:
      (metadata.avatar_url as string | undefined) ??
      (metadata.picture as string | undefined) ??
      null,
    isGuest: isGuestUser(user),
  }
}

/** Reads the persisted session, if any. Does not create one. */
export async function getActiveUser(): Promise<
  { user: AccountUser | null } | { error: string }
> {
  try {
    if (!isSupabaseConfigured()) {
      return { error: SUPABASE_NOT_CONFIGURED }
    }
    const supabase = getSupabase()
    if (!supabase) {
      return { error: 'Supabase client could not be created.' }
    }

    const { data, error } = await supabase.auth.getSession()
    if (error) {
      return { error: 'Could not verify the current session. Check your connection and try again.' }
    }
    const user = data.session?.user
    return { user: user ? toAccountUser(user) : null }
  } catch (error) {
    return { error: toErrorMessage(error, 'Could not verify the current session. Try again.') }
  }
}

/** Starts the Google OAuth redirect flow. On success the browser navigates away. */
export async function signInWithGoogle(): Promise<{ ok: true } | { error: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { error: SUPABASE_NOT_CONFIGURED }
    }
    const supabase = getSupabase()
    if (!supabase) {
      return { error: 'Supabase client could not be created.' }
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) {
      return { error: 'Could not start Google sign-in. Check your connection and try again.' }
    }
    return { ok: true }
  } catch (error) {
    return { error: toErrorMessage(error, 'Could not start Google sign-in. Try again.') }
  }
}

/** Creates an anonymous (guest) session. */
export async function continueAsGuest(): Promise<
  { user: AccountUser } | { error: string }
> {
  try {
    if (!isSupabaseConfigured()) {
      return { error: SUPABASE_NOT_CONFIGURED }
    }
    const supabase = getSupabase()
    if (!supabase) {
      return { error: 'Supabase client could not be created.' }
    }

    const existing = await supabase.auth.getSession()
    if (existing.data.session?.user) {
      return { user: toAccountUser(existing.data.session.user) }
    }

    const { data, error } = await supabase.auth.signInAnonymously()
    if (error || !data.user) {
      return {
        error: 'Could not start a guest session. Check your connection and try again.',
      }
    }
    return { user: toAccountUser(data.user) }
  } catch (error) {
    return { error: toErrorMessage(error, 'Could not start a guest session. Try again.') }
  }
}

export async function signOut(): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return { error: 'Supabase client could not be created.' }
    }
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { error: 'Could not sign out. Check your connection and try again.' }
    }
    return { ok: true }
  } catch (error) {
    return { error: toErrorMessage(error, 'Could not sign out. Try again.') }
  }
}

/** Subscribes to auth changes. Returns an unsubscribe function. */
export function onAuthChange(
  callback: (user: AccountUser | null) => void,
): () => void {
  const supabase = getSupabase()
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
    callback(session?.user ? toAccountUser(session.user) : null)
  })
  return () => data.subscription.unsubscribe()
}
