import type { AccountUser } from '../services/auth'

type Props = {
  user: AccountUser
  pending: null | 'google' | 'guest' | 'signout'
  onSignInWithGoogle: () => void
  onSignOut: () => void
}

export function AccountBadge({ user, pending, onSignInWithGoogle, onSignOut }: Props) {
  const busy = pending !== null

  return (
    <div className="flex items-center gap-3 text-sm">
      {user.isGuest ? (
        <>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            Guest
          </span>
          <button
            type="button"
            onClick={onSignInWithGoogle}
            disabled={busy}
            className="font-medium text-blueprint-700 underline disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {pending === 'google' ? 'Redirecting…' : 'Sign in with Google'}
          </button>
        </>
      ) : (
        <>
          <span className="flex items-center gap-2">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-6 w-6 rounded-full border border-slate-200"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <span className="max-w-[12rem] truncate text-slate-700">
              {user.name ?? user.email ?? 'Signed in'}
            </span>
          </span>
          <button
            type="button"
            onClick={onSignOut}
            disabled={busy}
            className="font-medium text-blueprint-700 underline disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {pending === 'signout' ? 'Signing out…' : 'Sign out'}
          </button>
        </>
      )}
    </div>
  )
}
