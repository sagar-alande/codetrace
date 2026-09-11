import { useState } from 'react'
import type { FeedbackRating } from '../types/research'
import { MAX_FEEDBACK_NOTE_LENGTH } from '../services/queryValidation'
import { StatusMessage } from './StatusMessage'

const MAX_NOTE_LENGTH = MAX_FEEDBACK_NOTE_LENGTH

type Props = {
  disabled: boolean
  saving: boolean
  error: string | null
  success: string | null
  onSubmit: (rating: FeedbackRating, note?: string) => void
}

const actions: { rating: FeedbackRating; label: string }[] = [
  { rating: 'helpful', label: 'Helpful' },
  { rating: 'not_helpful', label: 'Not Helpful' },
  { rating: 'report_incorrect', label: 'Report Incorrect' },
]

export function FeedbackBar({ disabled, saving, error, success, onSubmit }: Props) {
  const [note, setNote] = useState('')

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-blueprint-700">
        Inspector / contractor feedback
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.rating}
            type="button"
            disabled={disabled || saving}
            onClick={() => onSubmit(action.rating, note.trim() || undefined)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 hover:border-blueprint-400 hover:bg-blueprint-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>
      <label className="mt-3 block" htmlFor="feedback-note">
        <span className="mb-1 block text-xs text-slate-500">Optional note</span>
        <input
          id="feedback-note"
          name="feedback-note"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Describe an issue if reporting incorrect"
          disabled={disabled || saving}
          maxLength={MAX_NOTE_LENGTH}
          autoComplete="off"
          aria-describedby="feedback-note-help feedback-note-count"
        />
      </label>
      <div className="mt-1 flex items-start justify-between gap-3 text-xs text-slate-500">
        <p id="feedback-note-help">Do not include private information.</p>
        <p id="feedback-note-count" aria-live="polite">
          {note.length}/{MAX_NOTE_LENGTH}
        </p>
      </div>
      {saving ? <p className="mt-2 text-sm text-slate-500">Saving feedback…</p> : null}
      {error ? (
        <div className="mt-2">
          <StatusMessage tone="error">{error}</StatusMessage>
        </div>
      ) : null}
      {success ? (
        <div className="mt-2">
          <StatusMessage tone="success">{success}</StatusMessage>
        </div>
      ) : null}
    </section>
  )
}
