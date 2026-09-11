import type { Citation } from '../types/research'
import { safeHttpUrl } from '../services/text'
import { SourceStatusBadge } from './SourceStatusBadge'

type Props = {
  index: number
  citation: Citation
  onViewSource: (citation: Citation) => void
}

export function CitationCard({ index, citation, onViewSource }: Props) {
  const safeUrl = safeHttpUrl(citation.url)

  return (
    <article className="relative rounded-xl border border-slate-200 bg-white p-4 pl-11 shadow-sm">
      <span
        aria-hidden="true"
        className="absolute left-3 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 border-blueprint-600 bg-white font-mono text-xs font-bold text-blueprint-700"
      >
        {index}
      </span>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{citation.title}</p>
        <SourceStatusBadge status={citation.sourceStatus} />
      </div>
      {citation.sectionNumber ? (
        <p className="mt-1 font-mono text-xs text-blueprint-700">§ {citation.sectionNumber}</p>
      ) : citation.sourceStatus === 'official' ? (
        <p className="mt-1 font-mono text-xs text-slate-400">§ not stated in retrieved excerpt</p>
      ) : null}
      {citation.domain ? (
        <p className="mt-1 font-mono text-[11px] text-slate-500">{citation.domain}</p>
      ) : null}
      {safeUrl ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block break-all font-mono text-[11px] text-blueprint-700 hover:underline"
          aria-label={`Open ${citation.title} in a new tab`}
        >
          {safeUrl}
        </a>
      ) : null}
      <blockquote className="mt-3 border-l-2 border-blueprint-200 bg-blueprint-50/40 py-1.5 pl-3 pr-2 text-sm leading-6 text-slate-700">
        {citation.excerpt}
      </blockquote>
      {citation.retrievedAt ? (
        <p className="mt-2 font-mono text-[11px] text-slate-400">
          Retrieved {new Date(citation.retrievedAt).toLocaleString()}
        </p>
      ) : null}
      <button
        type="button"
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-blueprint-200 bg-white px-2.5 py-1 text-xs font-semibold text-blueprint-700 hover:bg-blueprint-50"
        onClick={() => onViewSource(citation)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        View source
      </button>
    </article>
  )
}
