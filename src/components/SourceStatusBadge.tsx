type Props = {
  status: 'official' | 'prototype'
}

export function SourceStatusBadge({ status }: Props) {
  if (status === 'official') {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
        <span aria-hidden="true">✓</span> Official Source
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-draft/50 bg-draft/10 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-draft">
      <span aria-hidden="true">◑</span> Prototype Reference
    </span>
  )
}
