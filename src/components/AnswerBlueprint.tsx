import type { ResearchAnswer } from '../types/research'
import { getCategory } from '../data/categories'
import { extractCodeCallouts } from '../services/codeCallouts'
import { BlueprintHouse } from './BlueprintHouse'

type Props = {
  question: string
  categoryId?: string
  answer: ResearchAnswer
}

export function AnswerBlueprint({ question, categoryId, answer }: Props) {
  const callouts = extractCodeCallouts([
    answer.summary,
    ...answer.citations.map((citation) => citation.excerpt),
    ...answer.citations.map((citation) => citation.sectionNumber),
  ])
  const categoryLabel = categoryId ? getCategory(categoryId)?.label : undefined

  return (
    <section className="bp-sheet bp-crop overflow-hidden rounded-xl border border-blueprint-200">
      <div className="border-b border-blueprint-200 bg-white/70 px-4 py-2.5 sm:px-5">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-blueprint-700">
          Blueprint trace
        </p>
        <p className="mt-0.5 text-sm text-slate-700">
          <span className="font-mono text-[11px] uppercase text-slate-400">Subject:</span>{' '}
          {question}
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <BlueprintHouse category={categoryId} className="mx-auto max-w-[600px]" />

        <div className="mt-4 border-t border-dashed border-blueprint-200 pt-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-blueprint-700">
            Requirements traced from the retrieved text
          </p>
          {callouts.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {callouts.map((callout) => (
                <li
                  key={`${callout.kind}-${callout.label}`}
                  className="rounded border border-blueprint-300 bg-white px-2 py-0.5 font-mono text-[11px] text-blueprint-800"
                >
                  {callout.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              The retrieved passages did not state a specific dimension or code section. Open each
              source to read the full requirement.
            </p>
          )}
          <p className="mt-3 font-mono text-[11px] text-slate-400">
            {categoryLabel ? `${categoryLabel} · ` : ''}
            {answer.sourceMode === 'official'
              ? 'Diagram is illustrative — confirm every value against the cited source.'
              : 'Prototype demo — not an official requirement.'}
          </p>
        </div>
      </div>
    </section>
  )
}
