import type { HistoryItem } from '../types/research'
import { SourceStatusBadge } from './SourceStatusBadge'
import { StatusMessage } from './StatusMessage'

type Props = {
  items: HistoryItem[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onReopen: (item: HistoryItem) => void
}

export function HistoryList({ items, loading, error, onRetry, onReopen }: Props) {
  return (
    <section className="space-y-3" aria-busy={loading}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-blueprint-700">
          Saved research
        </h2>
        <button
          type="button"
          className="text-xs font-medium text-blueprint-700 disabled:cursor-not-allowed disabled:text-slate-400"
          onClick={onRetry}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {loading ? <StatusMessage>Loading history…</StatusMessage> : null}
      {error ? (
        <StatusMessage tone="error">
          {error}{' '}
          <button type="button" className="underline" onClick={onRetry}>
            Try again
          </button>
        </StatusMessage>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <StatusMessage tone="empty">No saved research yet.</StatusMessage>
      ) : null}
      {!error
        ? items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onReopen(item)}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-blueprint-500 hover:bg-blueprint-50/40"
            >
              <p className="text-sm font-medium text-slate-900">{item.queryText}</p>
              <p className="mt-1 text-xs text-slate-500">
                {item.municipalityName} · {item.categoryLabel}
              </p>
              <p className="mt-1 font-mono text-[11px] text-slate-400">
                {new Date(item.createdAt).toLocaleString()}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.sourceMode === 'insufficient_official' || item.isFallback ? (
                  <span className="text-xs text-slate-500">Insufficient information</span>
                ) : item.includesPrototypeSources || item.sourceMode === 'prototype' ? (
                  <SourceStatusBadge status="prototype" />
                ) : (
                  <SourceStatusBadge status="official" />
                )}
              </div>
            </button>
          ))
        : null}
    </section>
  )
}
