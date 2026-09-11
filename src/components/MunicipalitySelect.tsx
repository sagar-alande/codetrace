import { municipalities } from '../data/municipalities'
import { getApprovedDomains } from '../data/jurisdictions'

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function MunicipalitySelect({ value, onChange, disabled = false }: Props) {
  const domains = value ? getApprovedDomains(value) : []

  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-blueprint-700">
        Jurisdiction
      </span>
      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blueprint-500"
        >
          <path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        <select
          className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-900 shadow-sm focus:border-blueprint-600 focus:outline-none focus:ring-2 focus:ring-blueprint-500/25 disabled:cursor-not-allowed disabled:bg-slate-50"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          <option value="">Select a jurisdiction</option>
          {municipalities.map((item) => (
            <option key={item.id} value={item.id}>
              {item.displayName}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {domains.length > 0 ? (
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span className="font-mono uppercase tracking-wide text-blueprint-600">Allowlist</span>
          {domains.map((domain) => (
            <span
              key={domain}
              className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-600"
            >
              {domain}
            </span>
          ))}
        </span>
      ) : null}
    </label>
  )
}
