type Props = {
  /** Selected research category id — highlights the matching zone. */
  category?: string
  className?: string
}

type Zone = {
  label: string
  x: number
  y: number
  w: number
  h: number
}

const ZONES: Record<string, Zone> = {
  decks: { label: 'DECK ASSEMBLY', x: 414, y: 150, w: 172, h: 192 },
  basements: { label: 'BASEMENT / EGRESS', x: 150, y: 320, w: 156, h: 92 },
  permits: { label: 'PERMIT SCOPE', x: 130, y: 96, w: 456, h: 320 },
  zoning: { label: 'SETBACK / ZONING', x: 40, y: 90, w: 124, h: 268 },
}

function ZoneTag({ zone }: { zone: Zone }) {
  const width = zone.label.length * 7.1 + 14
  return (
    <g className="animate-bp-pulse">
      <rect
        x={zone.x}
        y={zone.y}
        width={zone.w}
        height={zone.h}
        fill="#356db2"
        fillOpacity="0.1"
        stroke="#356db2"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        rx="2"
      />
      <rect x={zone.x} y={zone.y - 18} width={width} height="16" fill="#1f4374" rx="1" />
      <text
        x={zone.x + 7}
        y={zone.y - 6}
        className="font-mono"
        fill="#ffffff"
        fontSize="10"
        letterSpacing="0.5"
      >
        {zone.label}
      </text>
    </g>
  )
}

export function BlueprintHouse({ category, className }: Props) {
  const zone = category ? ZONES[category] : undefined

  return (
    <svg
      viewBox="0 0 680 440"
      role="img"
      aria-label={
        zone
          ? `Blueprint section of a house with the ${zone.label.toLowerCase()} area highlighted`
          : 'Blueprint section drawing of a two-storey house with a deck, basement egress and yard setback'
      }
      className={`block h-auto w-full text-blueprint-700 ${className ?? ''}`}
    >
      <defs>
        <pattern id="bp-earth" width="12" height="12" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="12" stroke="#1f4374" strokeWidth="1" strokeOpacity="0.4" />
        </pattern>
      </defs>

      {/* ground + earth hatch */}
      <rect x="0" y="330" width="680" height="110" fill="url(#bp-earth)" />
      <line x1="0" y1="330" x2="680" y2="330" stroke="currentColor" strokeWidth="2" />

      {/* property line + setback dimension */}
      <line
        x1="70"
        y1="70"
        x2="70"
        y2="360"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="10 4 3 4"
      />
      <text x="58" y="86" className="font-mono" fill="currentColor" fontSize="10" transform="rotate(-90 58 86)">
        PROPERTY LINE
      </text>
      <line x1="70" y1="348" x2="150" y2="348" stroke="currentColor" strokeWidth="1" />
      <path d="M70 344l6 4-6 4z M150 344l-6 4 6 4z" fill="currentColor" />
      <text x="82" y="342" className="font-mono" fill="currentColor" fontSize="10">
        SETBACK
      </text>

      {/* roof */}
      <path
        d="M140 178 L290 108 L440 178"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M150 178 L290 118 L430 178" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />

      {/* house envelope */}
      <rect x="150" y="178" width="280" height="152" fill="#ffffff" stroke="currentColor" strokeWidth="2" />
      {/* floor line */}
      <line x1="150" y1="254" x2="430" y2="254" stroke="currentColor" strokeWidth="1.5" />
      {/* below-grade foundation / basement */}
      <rect x="150" y="330" width="280" height="78" fill="#ffffff" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
      <text x="290" y="378" className="font-mono" fill="currentColor" fontSize="11" textAnchor="middle">
        BASEMENT
      </text>

      {/* egress window well at basement */}
      <path d="M150 360 h-26 v34 h26" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="150" y="360" width="6" height="22" fill="#356db2" fillOpacity="0.35" stroke="currentColor" strokeWidth="1" />
      <text x="150" y="406" className="font-mono" fill="currentColor" fontSize="9" textAnchor="middle">
        EGRESS
      </text>

      {/* windows / door on elevation */}
      <rect x="190" y="200" width="30" height="34" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="255" y="200" width="30" height="34" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="320" y="200" width="30" height="34" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="190" y="278" width="34" height="52" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <rect x="300" y="286" width="40" height="44" fill="none" stroke="currentColor" strokeWidth="1.2" />

      {/* attached deck */}
      <line x1="430" y1="288" x2="576" y2="288" stroke="currentColor" strokeWidth="2.5" />
      <line x1="430" y1="292" x2="576" y2="292" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
      {/* deck posts */}
      <line x1="470" y1="292" x2="470" y2="330" stroke="currentColor" strokeWidth="2" />
      <line x1="545" y1="292" x2="545" y2="330" stroke="currentColor" strokeWidth="2" />
      {/* footings */}
      <rect x="462" y="330" width="16" height="12" fill="url(#bp-earth)" stroke="currentColor" strokeWidth="1" />
      <rect x="537" y="330" width="16" height="12" fill="url(#bp-earth)" stroke="currentColor" strokeWidth="1" />
      {/* guardrail */}
      <line x1="576" y1="288" x2="576" y2="246" stroke="currentColor" strokeWidth="2" />
      <line x1="500" y1="288" x2="500" y2="246" stroke="currentColor" strokeWidth="1" />
      <line x1="538" y1="288" x2="538" y2="246" stroke="currentColor" strokeWidth="1" />
      <line x1="470" y1="288" x2="470" y2="246" stroke="currentColor" strokeWidth="1" />
      <line x1="470" y1="246" x2="576" y2="246" stroke="currentColor" strokeWidth="2" />
      {/* guard height dimension */}
      <line x1="596" y1="246" x2="596" y2="288" stroke="currentColor" strokeWidth="1" />
      <path d="M592 252l4-6 4 6z M592 282l4 6 4-6z" fill="currentColor" />
      <text x="604" y="270" className="font-mono" fill="currentColor" fontSize="9">
        GUARD
      </text>
      <text x="604" y="281" className="font-mono" fill="currentColor" fontSize="9">
        36&quot; MIN
      </text>
      {/* deck-height dimension */}
      <line x1="452" y1="288" x2="452" y2="330" stroke="currentColor" strokeWidth="1" />
      <path d="M448 294l4-6 4 6z M448 324l4 6 4-6z" fill="currentColor" />
      <text x="522" y="306" className="font-mono" fill="currentColor" fontSize="9" textAnchor="middle">
        HEIGHT
      </text>
      <text x="522" y="278" className="font-mono" fill="currentColor" fontSize="11" textAnchor="middle">
        DECK
      </text>

      {/* title block */}
      <g transform="translate(486 372)">
        <rect x="0" y="0" width="180" height="52" fill="#ffffff" stroke="currentColor" strokeWidth="1.5" />
        <line x1="0" y1="18" x2="180" y2="18" stroke="currentColor" strokeWidth="1" />
        <line x1="0" y1="35" x2="180" y2="35" stroke="currentColor" strokeWidth="1" />
        <text x="7" y="13" className="font-mono" fill="currentColor" fontSize="10" letterSpacing="1">
          SECTION A–A
        </text>
        <text x="7" y="30" className="font-mono" fill="currentColor" fontSize="9">
          RESIDENTIAL BUILDING CODE
        </text>
        <text x="7" y="47" className="font-mono" fill="currentColor" fontSize="9">
          SCALE: NTS · REF ONLY
        </text>
      </g>

      {/* scale bar */}
      <g transform="translate(20 410)">
        <rect x="0" y="0" width="20" height="6" fill="currentColor" />
        <rect x="20" y="0" width="20" height="6" fill="none" stroke="currentColor" strokeWidth="1" />
        <rect x="40" y="0" width="20" height="6" fill="currentColor" />
        <text x="0" y="20" className="font-mono" fill="currentColor" fontSize="9">
          0 — DIAGRAMMATIC
        </text>
      </g>

      {zone ? <ZoneTag zone={zone} /> : null}
      {!zone ? (
        <text x="340" y="60" className="font-mono" fill="currentColor" fontSize="11" textAnchor="middle" fillOpacity="0.7">
          SELECT A CATEGORY TO TRACE ITS CODE ZONE
        </text>
      ) : null}
    </svg>
  )
}
