import type { ReactNode } from 'react'
import { categories } from '../data/categories'

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const ICONS: Record<string, ReactNode> = {
  decks: (
    <path d="M3 9h18M3 15h18M7 9v10M12 5v14M17 9v10M5 5h14" />
  ),
  basements: (
    <path d="M4 5h4v4h4v4h4v4h4M4 5v14h16" />
  ),
  permits: (
    <path d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 17.5l1.8 1.8L15 15.5" />
  ),
  zoning: (
    <path d="M4 4v16h16M8 20V10h5V4M8 10H4M13 10h4v10" />
  ),
}

function CategoryIcon({ id }: { id: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
    >
      {ICONS[id] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  )
}

export function CategorySelect({ value, onChange, disabled = false }: Props) {
  return (
    <div role="group" aria-label="Research category">
      <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-blueprint-700">
        Research category
      </span>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((item) => {
          const active = value === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onChange(item.id)}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? 'border-blueprint-500 bg-blueprint-50 text-blueprint-900 shadow-sm ring-1 ring-blueprint-400'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-blueprint-300 hover:bg-blueprint-50/40'
              }`}
            >
              <span className={active ? 'text-blueprint-600' : 'text-slate-400'}>
                <CategoryIcon id={item.id} />
              </span>
              <span className="font-medium leading-tight">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
