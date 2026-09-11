export const CATEGORY_IDS = ['decks', 'basements', 'permits', 'zoning'] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]

export type JurisdictionConfig = {
  id: string
  displayName: string
  approvedDomains: string[]
  searchHint: string
}

export const JURISDICTIONS: JurisdictionConfig[] = [
  {
    id: 'austin',
    displayName: 'City of Austin, Texas',
    approvedDomains: ['austintexas.gov'],
    searchHint: 'City of Austin Texas building code permit',
  },
  {
    id: 'nyc',
    displayName: 'New York City, New York',
    approvedDomains: ['nyc.gov'],
    searchHint: 'New York City NYC building code permit',
  },
  {
    id: 'los-angeles',
    displayName: 'City of Los Angeles, California',
    approvedDomains: ['dbs.lacity.gov'],
    searchHint: 'City of Los Angeles DBS building code permit',
  },
  {
    id: 'chicago',
    displayName: 'City of Chicago, Illinois',
    approvedDomains: ['chicago.gov'],
    searchHint: 'City of Chicago Illinois building code permit',
  },
  {
    id: 'miami',
    displayName: 'City of Miami, Florida',
    approvedDomains: ['miami.gov'],
    searchHint: 'City of Miami Florida building code permit',
  },
]

export const CATEGORY_SEARCH_HINTS: Record<CategoryId, string> = {
  decks: 'deck porch structural remodel',
  basements: 'basement egress emergency escape',
  permits: 'building permit exempt work',
  zoning: 'zoning setback yard lot line',
}

export function getJurisdiction(id: string): JurisdictionConfig | undefined {
  return JURISDICTIONS.find((item) => item.id === id)
}

export function isSupportedCategory(id: string): id is CategoryId {
  return (CATEGORY_IDS as readonly string[]).includes(id)
}

export function hostMatchesApprovedDomain(hostname: string, approvedDomains: string[]): boolean {
  const host = hostname.toLowerCase()
  return approvedDomains.some((domain) => {
    const allowed = domain.toLowerCase()
    return host === allowed || host.endsWith(`.${allowed}`)
  })
}
