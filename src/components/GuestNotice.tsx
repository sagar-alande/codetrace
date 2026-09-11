type Props = {
  pending: null | 'google' | 'guest' | 'signout'
  onSignInWithGoogle: () => void
}

export function GuestNotice({ pending, onSignInWithGoogle }: Props) {
  return (
    <div className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <p className="font-medium text-slate-900">You are browsing as a guest</p>
      <p className="mt-1">
        Your research history and feedback are stored only in this browser and might not be
        saved &mdash; they can be lost when you clear site data or switch devices.{' '}
        <button
          type="button"
          onClick={onSignInWithGoogle}
          disabled={pending !== null}
          className="font-medium text-blueprint-700 underline disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {pending === 'google' ? 'Redirecting…' : 'Sign in with Google to keep it'}
        </button>
      </p>
    </div>
  )
}
