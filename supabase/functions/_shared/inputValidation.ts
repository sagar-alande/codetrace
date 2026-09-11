export const MIN_QUERY_LENGTH = 3
export const MAX_QUERY_LENGTH = 1000
export const MAX_FEEDBACK_NOTE_LENGTH = 500

export const QUERY_VALIDATION_MESSAGE =
  'Enter a research question as ordinary text between 3 and 1,000 characters. Remove HTML, scripts, event-handler markup, and javascript: or data:text/html links. Comparisons such as “under < 200 square feet” are allowed.'

export const FEEDBACK_NOTE_VALIDATION_MESSAGE =
  'Feedback notes must be ordinary text of 500 characters or fewer, without HTML, scripts, or unsafe links.'

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/
const HTML_LIKE_TAG = /<[a-zA-Z][\s\S]*?>|<[a-zA-Z][a-zA-Z0-9:-]*\b/
const SPACED_MARKUP_TAG =
  /<\s+(?:script|img|iframe|svg|object|embed|link|style|meta|form|base|video|audio|math|applet|html|body|input|button|textarea|frame|frameset)\b/i
const EVENT_HANDLER_MARKUP = /\bon[a-z]+\s*=/i
const DANGEROUS_PROTOCOL = /(?:^|[\s"'`=(])(?:java\s*script|vbscript)\s*:/i
const DATA_HTML_PROTOCOL = /data\s*:\s*text\s*\/\s*html/i

function containsDisallowedMarkup(text: string): boolean {
  return (
    CONTROL_CHARS.test(text) ||
    HTML_LIKE_TAG.test(text) ||
    SPACED_MARKUP_TAG.test(text) ||
    EVENT_HANDLER_MARKUP.test(text) ||
    DANGEROUS_PROTOCOL.test(text) ||
    DATA_HTML_PROTOCOL.test(text)
  )
}

export function validateResearchQuery(
  raw: unknown,
): { ok: true; query: string } | { ok: false; message: string } {
  if (typeof raw !== 'string') {
    return { ok: false, message: QUERY_VALIDATION_MESSAGE }
  }

  const query = raw.trim()
  if (query.length < 3 || query.length > 1000) {
    return { ok: false, message: QUERY_VALIDATION_MESSAGE }
  }

  if (containsDisallowedMarkup(query)) {
    return { ok: false, message: QUERY_VALIDATION_MESSAGE }
  }

  return { ok: true, query }
}

export function validateFeedbackNote(
  raw: unknown,
): { ok: true; note: string | null } | { ok: false; message: string } {
  if (raw == null) return { ok: true, note: null }
  if (typeof raw !== 'string') {
    return { ok: false, message: FEEDBACK_NOTE_VALIDATION_MESSAGE }
  }

  const note = raw.trim()
  if (!note) return { ok: true, note: null }
  if (note.length > MAX_FEEDBACK_NOTE_LENGTH || containsDisallowedMarkup(note)) {
    return { ok: false, message: FEEDBACK_NOTE_VALIDATION_MESSAGE }
  }

  return { ok: true, note }
}

export function jsonNestingDepth(value: unknown, depth = 0): number {
  if (depth > 8) return depth
  if (value !== null && typeof value === 'object') {
    const nested = Array.isArray(value) ? value : Object.values(value)
    let max = depth
    for (const item of nested) {
      max = Math.max(max, jsonNestingDepth(item, depth + 1))
      if (max > 8) return max
    }
    return max
  }
  return depth
}
