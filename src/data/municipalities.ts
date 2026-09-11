import type { Municipality } from '../types/research'

export const municipalities: Municipality[] = [
  {
    id: 'austin',
    name: 'City of Austin',
    state: 'Texas',
    displayName: 'City of Austin, Texas',
  },
  {
    id: 'nyc',
    name: 'New York City',
    state: 'New York',
    displayName: 'New York City, New York',
  },
  {
    id: 'los-angeles',
    name: 'City of Los Angeles',
    state: 'California',
    displayName: 'City of Los Angeles, California',
  },
  {
    id: 'chicago',
    name: 'City of Chicago',
    state: 'Illinois',
    displayName: 'City of Chicago, Illinois',
  },
  {
    id: 'miami',
    name: 'City of Miami',
    state: 'Florida',
    displayName: 'City of Miami, Florida',
  },
]

export function getMunicipality(id: string): Municipality | undefined {
  return municipalities.find((item) => item.id === id)
}
