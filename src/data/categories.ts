import type { Category } from '../types/research'

export const categories: Category[] = [
  { id: 'decks', label: 'Decks and structural remodels' },
  { id: 'basements', label: 'Basements and egress' },
  { id: 'permits', label: 'Permit requirements and exempt work' },
  { id: 'zoning', label: 'Zoning and setbacks' },
]

export function getCategory(id: string): Category | undefined {
  return categories.find((item) => item.id === id)
}
