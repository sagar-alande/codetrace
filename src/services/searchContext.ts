export const GENERIC_QUESTION_PLACEHOLDER = 'Example: Do I need a permit to replace an existing deck?'

const SAMPLE_QUESTIONS: Record<string, Record<string, string>> = {
  austin: {
    decks: 'Do I need a permit to replace an existing deck in Austin?',
    basements: 'What basement egress rules apply in Austin?',
    permits: 'What work is exempt from a building permit in Austin?',
    zoning: 'What rear setback applies to a detached garage in Austin?',
  },
  nyc: {
    decks: 'Do I need a permit to replace an existing deck in New York City?',
    basements: 'What basement egress rules apply in New York City?',
    permits: 'What work is exempt from a building permit in New York City?',
    zoning: 'What rear yard setback applies to an accessory garage in New York City?',
  },
  'los-angeles': {
    decks: 'Do I need a permit to replace an existing deck in Los Angeles?',
    basements: 'What basement egress rules apply in Los Angeles?',
    permits: 'What work is exempt from a building permit in Los Angeles?',
    zoning: 'What rear setback applies to a detached garage in Los Angeles?',
  },
  chicago: {
    decks: 'Do I need a permit to replace an existing deck in Chicago?',
    basements: 'What basement egress rules apply in Chicago?',
    permits: 'What work is exempt from a building permit in Chicago?',
    zoning: 'What zoning setback rules apply to a detached garage in Chicago?',
  },
  miami: {
    decks: 'Do I need a permit to replace an existing deck in Miami?',
    basements: 'What basement egress rules apply in Miami?',
    permits: 'What work is exempt from a building permit in Miami?',
    zoning: 'What rear setback applies to a detached garage in Miami?',
  },
}

export function sampleQuestionPlaceholder(municipalityId: string, categoryId: string): string {
  if (!municipalityId || !categoryId) return GENERIC_QUESTION_PLACEHOLDER
  return SAMPLE_QUESTIONS[municipalityId]?.[categoryId] ?? GENERIC_QUESTION_PLACEHOLDER
}

const QUESTION_TEMPLATES: Record<string, string[]> = {
  decks: [
    'Do I need a permit to build a new attached deck in %CITY%?',
    'What minimum guardrail height applies to a residential deck in %CITY%?',
    'Are deck footings and ledger connections inspected in %CITY%?',
    'Do I need a permit to replace the decking boards on an existing deck in %CITY%?',
  ],
  basements: [
    'What emergency escape and rescue opening is required for a basement bedroom in %CITY%?',
    'What minimum ceiling height applies to a habitable basement in %CITY%?',
    'Do I need a permit to finish an existing basement in %CITY%?',
    'Is a window well required for a below-grade egress window in %CITY%?',
  ],
  permits: [
    'What residential work is exempt from a building permit in %CITY%?',
    'Do I need a permit to re-roof a single-family house in %CITY%?',
    'Do I need a permit to build a detached storage shed in %CITY%?',
    'Is a permit required to replace windows in the same openings in %CITY%?',
  ],
  zoning: [
    'What rear setback applies to a detached garage in %CITY%?',
    'How close to the side property line can a single-story addition be built in %CITY%?',
    'What is the maximum lot coverage for a single-family lot in %CITY%?',
    'Are there height limits for an accessory structure in %CITY%?',
  ],
}

const CITY_SHORT_NAME: Record<string, string> = {
  austin: 'Austin',
  nyc: 'New York City',
  'los-angeles': 'Los Angeles',
  chicago: 'Chicago',
  miami: 'Miami',
}

/**
 * Suggested starter questions for the chosen jurisdiction + category.
 * Empty until both are selected. These are prompts only, never auto-submitted.
 */
export function sampleQuestions(municipalityId: string, categoryId: string): string[] {
  if (!municipalityId || !categoryId) return []
  const templates = QUESTION_TEMPLATES[categoryId]
  const city = CITY_SHORT_NAME[municipalityId]
  if (!templates || !city) return []
  return templates.map((template) => template.replace('%CITY%', city))
}

export function clearedResearchDraft(): {
  query: string
  answer: null
  viewingCitation: null
  historyId: null
  searchError: null
  saveError: null
  feedbackError: null
  feedbackSuccess: null
} {
  return {
    query: '',
    answer: null,
    viewingCitation: null,
    historyId: null,
    searchError: null,
    saveError: null,
    feedbackError: null,
    feedbackSuccess: null,
  }
}
