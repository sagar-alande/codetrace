export function DisclaimerBanner() {
  return (
    <div className="rounded-lg border-l-4 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
        Research and reference tool only
      </p>
      <p className="mt-1 text-amber-900">
        CodeTrace does not certify code compliance and does not replace inspectors, engineers,
        architects, or municipal authorities. Official Source means the page came from an approved
        municipal domain, not that this tool has verified a legal conclusion.
      </p>
    </div>
  )
}
