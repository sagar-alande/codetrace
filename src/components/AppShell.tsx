import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  headerRight?: ReactNode
}

export function AppShell({ children, headerRight }: Props) {
  return (
    <div className="bp-grid min-h-svh text-ink">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-white px-3 py-2 text-sm font-medium text-blueprint-800 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <header className="border-b-2 border-blueprint-800 bg-blueprint-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-9 w-9 items-center justify-center rounded border border-white/25 bg-blueprint-800 font-mono text-sm font-bold text-draft-soft"
            >
              CT
            </span>
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-blueprint-200">
                CodeTrace
              </p>
              <h1 className="text-xl font-semibold sm:text-2xl">
                Residential building-code research
              </h1>
              <p className="mt-1 max-w-md text-sm text-blueprint-100">
                Official-source research for five U.S. municipal jurisdictions. Not a compliance
                determination.
              </p>
            </div>
          </div>
          {headerRight ? (
            <div className="shrink-0 rounded-lg bg-white/95 px-3 py-2 text-ink shadow-sm">
              {headerRight}
            </div>
          ) : null}
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  )
}
