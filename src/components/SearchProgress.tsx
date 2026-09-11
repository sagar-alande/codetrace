type Props = {
  municipalityName?: string
  domains: string[]
}

export function SearchProgress({ municipalityName, domains }: Props) {
  return (
    <div
      className="bp-crop relative overflow-hidden rounded-xl border border-blueprint-200 bg-blueprint-50/60 p-5"
      role="status"
      aria-live="polite"
    >
      <div className="bp-scanline top-0 animate-bp-scan" aria-hidden="true" />
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-blueprint-700">
        Tracing official sources
      </p>
      <p className="mt-2 text-sm text-blueprint-900">
        Searching {municipalityName ? <span className="font-medium">{municipalityName}</span> : 'the selected jurisdiction'}
        {' '}on its approved municipal domains only.
      </p>
      {domains.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {domains.map((domain) => (
            <li
              key={domain}
              className="rounded border border-blueprint-200 bg-white px-2 py-0.5 font-mono text-[11px] text-blueprint-700"
            >
              {domain}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
