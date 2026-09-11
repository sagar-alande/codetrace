import type { Citation, ResearchAnswer } from '../types/research'
import { CitationCard } from './CitationCard'

type Props = {
  answer: ResearchAnswer
  onViewSource: (citation: Citation) => void
}

export function AnswerPanel({ answer, onViewSource }: Props) {
  const modeLabel =
    answer.sourceMode === 'prototype'
      ? 'Prototype demo mode — not official sources'
      : answer.sourceMode === 'official'
        ? 'Official municipal sources only'
        : 'No adequate official source found'

  const accent =
    answer.sourceMode === 'official'
      ? 'border-blueprint-600'
      : answer.sourceMode === 'prototype'
        ? 'border-draft'
        : 'border-slate-400'

  return (
    <section className="space-y-4">
      <div
        className={`bp-crop relative overflow-hidden rounded-xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${accent}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Finding
          </h2>
          <span
            className={`font-mono text-[11px] font-semibold uppercase tracking-wide ${
              answer.sourceMode === 'prototype' ? 'text-draft' : 'text-blueprint-700'
            }`}
          >
            {modeLabel}
          </span>
        </div>
        {answer.retrievedAt ? (
          <p className="mt-1 font-mono text-[11px] text-slate-400">
            Retrieved {new Date(answer.retrievedAt).toLocaleString()}
          </p>
        ) : null}
        <p className="mt-3 text-[15px] leading-7 text-slate-900">{answer.summary}</p>
        {answer.sourceMode === 'official' ? (
          <p className="mt-3 border-t border-dashed border-slate-200 pt-3 text-xs leading-5 text-slate-500">
            This summary is drawn from official municipal pages for the selected jurisdiction. It is
            not a legal determination, permit approval, or certified code interpretation. Review each
            official page and confirm requirements with the municipality and licensed professionals.
          </p>
        ) : null}
      </div>

      {!answer.isFallback ? (
        <div className="space-y-3">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {answer.sourceMode === 'official'
              ? 'Supporting official sources'
              : 'Supporting citations'}
          </h3>
          {answer.citations.map((citation, index) => (
            <CitationCard
              key={citation.recordId}
              index={index + 1}
              citation={citation}
              onViewSource={onViewSource}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
