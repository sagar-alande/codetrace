import type { Citation } from '../types/research'
import { safeHttpUrl } from '../services/text'
import { SourceStatusBadge } from './SourceStatusBadge'

type Props = {
  citation: Citation | null
}

export function SourceViewer({ citation }: Props) {
  if (!citation) {
    return (
      <div className="bp-sheet rounded-xl border border-dashed border-blueprint-300 p-5 text-center text-sm text-slate-500">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-blueprint-600">
          Source viewer
        </p>
        <p className="mt-2">Select a citation to inspect the supporting passage.</p>
      </div>
    )
  }

  const safeUrl = safeHttpUrl(citation.url)

  return (
    <aside
      className="bp-crop overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      aria-live="polite"
      aria-label="Selected source details"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-blueprint-50/60 px-5 py-3">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-blueprint-700">
          Source viewer
        </h2>
        <SourceStatusBadge status={citation.sourceStatus} />
      </div>
      <div className="p-5">
        <h3 className="text-sm font-semibold text-slate-900">{citation.title}</h3>
        {citation.sectionNumber ? (
          <p className="mt-1 font-mono text-sm text-blueprint-700">§ {citation.sectionNumber}</p>
        ) : citation.sourceStatus === 'official' ? (
          <p className="mt-1 font-mono text-sm text-slate-400">§ not stated in retrieved excerpt</p>
        ) : null}
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11px] text-slate-600">
          {citation.municipalityName ? (
            <>
              <dt className="text-slate-400">JURIS</dt>
              <dd>{citation.municipalityName}</dd>
            </>
          ) : null}
          {citation.domain ? (
            <>
              <dt className="text-slate-400">DOMAIN</dt>
              <dd>{citation.domain}</dd>
            </>
          ) : null}
          {safeUrl ? (
            <>
              <dt className="text-slate-400">URL</dt>
              <dd className="break-all">
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blueprint-700 hover:underline"
                  aria-label={`Open ${citation.title} in a new tab`}
                >
                  {safeUrl}
                </a>
              </dd>
            </>
          ) : null}
          {citation.retrievedAt ? (
            <>
              <dt className="text-slate-400">RETR</dt>
              <dd>{new Date(citation.retrievedAt).toLocaleString()}</dd>
            </>
          ) : null}
          {citation.documentTitle ? (
            <>
              <dt className="text-slate-400">DOC</dt>
              <dd>{citation.documentTitle}</dd>
            </>
          ) : null}
        </dl>
        <p className="mt-4 border-l-2 border-blueprint-200 bg-blueprint-50/40 py-2 pl-3 pr-2 text-sm leading-6 text-slate-800">
          {citation.excerpt}
        </p>
      </div>
    </aside>
  )
}
