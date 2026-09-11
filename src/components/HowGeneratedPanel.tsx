export function HowGeneratedPanel() {
  return (
    <details className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-blueprint-700">
        How this answer was generated
      </summary>
      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        <p>
          Live answers come from official municipal websites searched through Tavily, limited to
          each jurisdiction’s approved domains. The Tavily key stays on the server. The client
          cannot choose trusted domains.
        </p>
        <p>
          Retrieval is municipality-first: only the selected city’s allowlisted domains are
          searched. Results from another city are never used. Hostnames that do not match the
          allowlist are discarded.
        </p>
        <p>
          Official Source means the URL passed that domain check. It does not mean CodeTrace has
          certified the legal meaning of the page. Prototype Reference is local sample data used
          only in demo fallback, never mixed into a live official-source answer.
        </p>
        <p>
          If official pages do not contain enough evidence, CodeTrace says it does not have enough
          information. An API failure is reported as an error, not as “no requirement exists.”
        </p>
        <p>
          CodeTrace is a research and reference tool. It does not certify code compliance and does
          not replace inspectors, engineers, architects, or municipal authorities.
        </p>
      </div>
    </details>
  )
}
