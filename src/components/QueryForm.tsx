import type { FormEvent } from 'react'
import { MAX_QUERY_LENGTH } from '../services/queryValidation'

type Props = {
  query: string
  placeholder: string
  onQueryChange: (value: string) => void
  onSubmit: () => void
  disabled: boolean
  canSubmit: boolean
  isSearching: boolean
}

export function QueryForm({
  query,
  placeholder,
  onQueryChange,
  onSubmit,
  disabled,
  canSubmit,
  isSearching,
}: Props) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit()
  }

  const nearLimit = query.length > MAX_QUERY_LENGTH * 0.9

  return (
    <form onSubmit={handleSubmit} className="space-y-2" aria-busy={isSearching}>
      <label className="block" htmlFor="research-question">
        <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-blueprint-700">
          Research question
        </span>
        <textarea
          id="research-question"
          name="research-question"
          className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm leading-6 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blueprint-600 focus:outline-none focus:ring-2 focus:ring-blueprint-500/25 disabled:cursor-not-allowed disabled:bg-slate-50"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled || isSearching}
          required
          minLength={3}
          maxLength={MAX_QUERY_LENGTH}
          aria-describedby="research-question-help research-question-count"
        />
      </label>
      <div className="flex items-start justify-between gap-3 text-xs text-slate-500">
        <p id="research-question-help">
          Enter 3–1,000 characters of ordinary text. Do not include private information, HTML, or
          scripts. Comparisons such as “under &lt; 200 square feet” are allowed.
        </p>
        <p
          id="research-question-count"
          aria-live="polite"
          className={`shrink-0 font-mono ${nearLimit ? 'text-draft' : 'text-slate-400'}`}
        >
          {query.length}/{MAX_QUERY_LENGTH}
        </p>
      </div>
      <button
        type="submit"
        disabled={!canSubmit || isSearching}
        aria-busy={isSearching}
        className="inline-flex items-center gap-2 rounded-lg bg-blueprint-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blueprint-600 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        {isSearching ? 'Searching official sources…' : 'Search official sources'}
      </button>
    </form>
  )
}
