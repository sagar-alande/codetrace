import type { CorpusRecord } from '../types/research'
import { municipalities } from './municipalities'
import { categories } from './categories'

const cityCodes: Record<string, string> = {
  austin: 'AUS',
  nyc: 'NYC',
  'los-angeles': 'LAX',
  chicago: 'CHI',
  miami: 'MIA',
}

const categoryCodes: Record<string, string> = {
  decks: 'DECK',
  basements: 'BASE',
  permits: 'PERM',
  zoning: 'ZONE',
}

const topicPhrases: Record<string, string> = {
  decks:
    'decks, porches, and structural remodels. Sample search terms include deck, remodel, framing, and structural attachment.',
  basements:
    'basements and egress. Sample search terms include basement, cellar, egress, and emergency escape.',
  permits:
    'permit requirements and exempt work. Sample search terms include permit, exemption, exempt work, and when a permit is required.',
  zoning:
    'zoning and setbacks. Sample search terms include zoning, setback, lot line, and yard.',
}

function prototypeNote(
  municipalityId: string,
  categoryId: string,
  extras?: Partial<CorpusRecord>,
): CorpusRecord {
  const municipality = municipalities.find((item) => item.id === municipalityId)
  const category = categories.find((item) => item.id === categoryId)
  if (!municipality || !category) {
    throw new Error('Unknown municipality or category')
  }

  const cityCode = cityCodes[municipalityId]
  const catCode = categoryCodes[categoryId]
  const sectionNumber = extras?.sectionNumber ?? `PROTO-${cityCode}-${catCode}-01`

  return {
    id: `${municipalityId}-${categoryId}-01`,
    municipalityId,
    state: municipality.state,
    categoryId,
    documentType: 'prototype_note',
    documentTitle: `CodeTrace prototype note — ${municipality.displayName}`,
    sectionNumber,
    sectionTitle: `${category.label} (prototype sample)`,
    textContent: `This is a CodeTrace Prototype Reference for ${category.label.toLowerCase()} in ${municipality.displayName}. It is sample text used only to demonstrate municipality-scoped retrieval. It is not an official building-code section, ordinance, permit rule, or municipal requirement. ${topicPhrases[categoryId]} Confirm every project requirement with ${municipality.name} and licensed design professionals.`,
    status: 'active',
    sourceStatus: 'prototype',
    ...extras,
  }
}

export const corpus: CorpusRecord[] = [
  ...municipalities.flatMap((municipality) =>
    categories.map((category) => prototypeNote(municipality.id, category.id)),
  ),
  prototypeNote('austin', 'decks', {
    id: 'austin-decks-inactive',
    sectionNumber: 'PROTO-AUS-DECK-00',
    sectionTitle: 'Decks and structural remodels (inactive prototype sample)',
    status: 'inactive',
    textContent:
      'This CodeTrace Prototype Reference is marked inactive so retrieval can ignore it. It is not current sample material and must not be returned as a current source. It is not an official City of Austin requirement.',
  }),
]

export function getCorpusRecord(id: string): CorpusRecord | undefined {
  return corpus.find((item) => item.id === id)
}
