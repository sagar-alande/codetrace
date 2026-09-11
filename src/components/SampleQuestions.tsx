type Props = {
  questions: string[]
  onPick: (question: string) => void
  disabled?: boolean
}

export function SampleQuestions({ questions, onPick, disabled = false }: Props) {
  if (questions.length === 0) return null

  return (
    <div>
      <span className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-blueprint-700">
        Sample questions for this scope
      </span>
      <ul className="flex flex-col gap-1.5">
        {questions.map((question) => (
          <li key={question}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(question)}
              className="group flex w-full items-start gap-2 rounded-lg border border-dashed border-blueprint-300 bg-blueprint-50/40 px-3 py-2 text-left text-sm text-slate-700 hover:border-blueprint-500 hover:bg-blueprint-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 font-mono text-xs text-blueprint-500 group-hover:text-blueprint-700"
              >
                →
              </span>
              {question}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-xs text-slate-400">
        Selecting one fills the question box — review and edit it before searching.
      </p>
    </div>
  )
}
