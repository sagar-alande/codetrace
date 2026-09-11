import { municipalities } from '../data/municipalities'
import { StatusMessage } from './StatusMessage'

const JURISDICTION_NAMES = municipalities
  .map((item) => item.name.replace(/^City of /, ''))
  .join(' · ')

type Props = {
  /** Name/email when a non-guest session is already persisted; null otherwise. */
  authedName: string | null
  pending: null | 'google' | 'guest' | 'signout'
  error: string | null
  onSignInWithGoogle: () => void
  onContinueAsGuest: () => void
  onEnter: () => void
  onSignOut: () => void
  onRetry: () => void
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5 shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GuestIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5 shrink-0"
    >
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3.5 20c0-3.6 2.8-6 6.5-6 1.1 0 2.2.22 3.1.62" strokeLinecap="round" />
      <path d="M15.5 14.5l4 4m0-4l-4 4" strokeLinecap="round" />
    </svg>
  )
}

export function LoginPage({
  authedName,
  pending,
  error,
  onSignInWithGoogle,
  onContinueAsGuest,
  onEnter,
  onSignOut,
  onRetry,
}: Props) {
  const busy = pending !== null

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-900/5">
        {/* Dark header */}
        <div className="bg-slate-900 px-6 pb-7 pt-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-lg font-bold tracking-tight text-amber-500 ring-1 ring-white/10">
            CT
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-500">
            <span aria-hidden="true">🚀</span> Multi-Jurisdiction Code Research &middot; v2
          </div>
          <h1 className="mt-3 text-2xl font-bold text-white">Welcome to CodeTrace</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-300">
            AI-powered research on the 2024 International Residential Code (IRC) and local
            technical amendments across {municipalities.length} U.S. municipal jurisdictions.
          </p>
          <p className="mt-3 text-[13px] font-medium text-amber-400">
            {JURISDICTION_NAMES} &mdash; more jurisdictions and code categories planned for
            future versions.
          </p>
        </div>

        {/* Light body */}
        <div className="space-y-3 bg-white px-6 py-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex gap-3">
              <span className="mt-0.5 text-slate-400">
                <ClockIcon />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Save Your Research &amp; Feedback
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                  Sign in to securely sync your search history, bookmark findings, and record
                  contractor feedback across sessions.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <span className="mt-0.5 text-amber-500">
                <GuestIcon />
              </span>
              <div>
                <p className="text-sm font-semibold text-amber-900">Guest Mode Notice</p>
                <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
                  You can freely use all CodeTrace research tools and corpus explorers as a
                  guest, but{' '}
                  <strong className="font-semibold">
                    your research history and inspector feedback will not be saved.
                  </strong>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {authedName ? (
              <>
                <button
                  type="button"
                  onClick={onEnter}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue to CodeTrace
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  disabled={busy}
                  className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending === 'signout' ? 'Signing out…' : `Sign out (${authedName})`}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onSignInWithGoogle}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <GoogleIcon />
                  {pending === 'google' ? 'Redirecting to Google…' : 'Sign in with Google'}
                </button>
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending === 'guest' ? 'Starting guest session…' : 'Continue as Guest'}
                  {pending === 'guest' ? null : <span aria-hidden="true">→</span>}
                </button>
              </>
            )}
          </div>

          {error ? (
            <StatusMessage tone="error">
              {error}{' '}
              <button type="button" className="font-medium underline" onClick={onRetry}>
                Try again
              </button>
            </StatusMessage>
          ) : null}

          <p className="pt-1 text-center text-[11px] text-slate-400">
            <span aria-hidden="true">🔒</span> Advisory code tool &middot; You can sign in anytime
            from the top bar
          </p>
        </div>
      </div>
    </div>
  )
}
