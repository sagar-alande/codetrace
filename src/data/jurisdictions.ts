export type JurisdictionConfig = {
  id: string
  approvedDomains: string[]
}

export const JURISDICTIONS: JurisdictionConfig[] = [
  { id: 'austin', approvedDomains: ['austintexas.gov'] },
  { id: 'nyc', approvedDomains: ['nyc.gov'] },
  { id: 'los-angeles', approvedDomains: ['dbs.lacity.gov'] },
  { id: 'chicago', approvedDomains: ['chicago.gov'] },
  { id: 'miami', approvedDomains: ['miami.gov'] },
]

export function getApprovedDomains(municipalityId: string): string[] {
  return JURISDICTIONS.find((item) => item.id === municipalityId)?.approvedDomains ?? []
}
