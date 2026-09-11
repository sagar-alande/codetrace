import type { ReactNode } from 'react'

type Props = {
  tone?: 'info' | 'error' | 'success' | 'empty'
  children: ReactNode
}

export function StatusMessage({ tone = 'info', children }: Props) {
  const styles = {
    info: 'border-slate-200 bg-slate-50 text-slate-700',
    error: 'border-red-200 bg-red-50 text-red-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    empty: 'border-dashed border-slate-300 bg-white text-slate-500',
  }[tone]

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${styles}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      {children}
    </div>
  )
}
