import { useCallback, useEffect, useRef, useState } from 'react'
import {
  continueAsGuest as continueAsGuestRequest,
  getActiveUser,
  onAuthChange,
  signInWithGoogle as signInWithGoogleRequest,
  signOut as signOutRequest,
  type AccountUser,
} from '../services/auth'
import { isSupabaseConfigured } from '../services/supabaseClient'
import { toErrorMessage } from '../services/text'

export type AuthStatus = 'loading' | 'authenticated' | 'signed_out'

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AccountUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<null | 'google' | 'guest' | 'signout'>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)

    if (!isSupabaseConfigured()) {
      if (!mounted.current) return
      setError(
        'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.',
      )
      setStatus('signed_out')
      return
    }

    try {
      const result = await getActiveUser()
      if (!mounted.current) return
      if ('error' in result) {
        setError(result.error)
        setStatus('signed_out')
        return
      }
      setUser(result.user)
      setStatus(result.user ? 'authenticated' : 'signed_out')
    } catch (caught) {
      if (!mounted.current) return
      setError(toErrorMessage(caught, 'Could not verify the current session. Try again.'))
      setStatus('signed_out')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    return onAuthChange((nextUser) => {
      if (!mounted.current) return
      setUser(nextUser)
      setStatus(nextUser ? 'authenticated' : 'signed_out')
    })
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setPending('google')
    setError(null)
    const result = await signInWithGoogleRequest()
    if ('error' in result) {
      if (mounted.current) {
        setError(result.error)
        setPending(null)
      }
      return
    }
    // On success the browser redirects to Google; keep the pending state.
  }, [])

  const continueAsGuest = useCallback(async (): Promise<boolean> => {
    setPending('guest')
    setError(null)
    const result = await continueAsGuestRequest()
    if (!mounted.current) return false
    setPending(null)
    if ('error' in result) {
      setError(result.error)
      return false
    }
    setUser(result.user)
    setStatus('authenticated')
    return true
  }, [])

  const signOut = useCallback(async () => {
    setPending('signout')
    setError(null)
    const result = await signOutRequest()
    if (!mounted.current) return
    setPending(null)
    if ('error' in result) {
      setError(result.error)
      return
    }
    setUser(null)
    setStatus('signed_out')
  }, [])

  return {
    status,
    user,
    error,
    pending,
    isGuest: user?.isGuest ?? false,
    retry: load,
    signInWithGoogle,
    continueAsGuest,
    signOut,
  }
}
