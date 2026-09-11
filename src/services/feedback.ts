import type { FeedbackRating } from '../types/research'
import { getSupabase } from './supabaseClient'
import { validateFeedbackNote } from './queryValidation'
import { isUuid } from './storedPayload'
import { toErrorMessage } from './text'

export async function saveFeedback(input: {
  historyId: string
  rating: FeedbackRating
  note?: string
}): Promise<{ ok: true } | { error: string }> {
  try {
    const allowedRatings: FeedbackRating[] = ['helpful', 'not_helpful', 'report_incorrect']
    if (!allowedRatings.includes(input.rating)) {
      return { error: 'Choose a valid feedback rating.' }
    }

    if (!isUuid(input.historyId)) {
      return { error: 'Feedback could not be saved. Check your connection and try again.' }
    }

    const noteResult = validateFeedbackNote(input.note)
    if (!noteResult.ok) {
      return { error: noteResult.message }
    }

    const supabase = getSupabase()
    if (!supabase) {
      return { error: 'Supabase is not configured. Feedback was not saved.' }
    }

    const { error } = await supabase.from('feedback').insert({
      history_id: input.historyId,
      rating: input.rating,
      note: noteResult.note,
    })

    if (error) {
      return { error: 'Feedback could not be saved. Check your connection and try again.' }
    }

    return { ok: true }
  } catch (error) {
    return {
      error: toErrorMessage(error, 'Feedback could not be saved. Try again.'),
    }
  }
}
