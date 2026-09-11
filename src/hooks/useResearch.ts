import { useCallback, useEffect, useState } from 'react'
import { getCategory } from '../data/categories'
import { getMunicipality } from '../data/municipalities'
import { buildOfficialAnswer, buildPrototypeAnswer } from '../services/answer'
import { saveFeedback } from '../services/feedback'
import { listResearchHistory, saveResearchHistory } from '../services/history'
import { retrieveRecords } from '../services/retrieval'
import { searchOfficialSources } from '../services/searchOfficial'
import { isSupabaseConfigured } from '../services/supabaseClient'
import { validateResearchQuery } from '../services/queryValidation'
import { clearedResearchDraft } from '../services/searchContext'
import { toErrorMessage } from '../services/text'
import type { Citation, FeedbackRating, HistoryItem, ResearchAnswer } from '../types/research'

export function useResearch() {
  const [municipalityId, setMunicipalityId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState<ResearchAnswer | null>(null)
  const [viewingCitation, setViewingCitation] = useState<Citation | null>(null)
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSavingHistory, setIsSavingHistory] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [isFeedbackSaving, setIsFeedbackSaving] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setHistoryError(
        'Supabase is not configured. History cannot be loaded until credentials are added.',
      )
      setIsHistoryLoading(false)
      return
    }

    setIsHistoryLoading(true)
    setHistoryError(null)
    try {
      const result = await listResearchHistory()
      if ('error' in result) {
        setHistoryError(result.error)
        return
      }
      setHistory(result.items)
    } catch (error) {
      setHistoryError(toErrorMessage(error, 'History could not be loaded. Try again.'))
    } finally {
      setIsHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  function resetAnswerState() {
    const cleared = clearedResearchDraft()
    setQuery(cleared.query)
    setAnswer(cleared.answer)
    setViewingCitation(cleared.viewingCitation)
    setHistoryId(cleared.historyId)
    setSaveError(cleared.saveError)
    setFeedbackError(cleared.feedbackError)
    setFeedbackSuccess(cleared.feedbackSuccess)
    setSearchError(cleared.searchError)
  }

  function changeMunicipality(id: string) {
    setMunicipalityId(id)
    resetAnswerState()
  }

  function changeCategory(id: string) {
    setCategoryId(id)
    resetAnswerState()
  }

  async function persistAnswer(
    municipality: { id: string; displayName: string; state: string },
    category: { id: string; label: string },
    nextAnswer: ResearchAnswer,
    question: string,
  ) {
    if (!isSupabaseConfigured()) {
      setSaveError(
        'This answer is shown, but it was not saved. Configure Supabase to store history.',
      )
      return
    }

    setIsSavingHistory(true)
    setSaveError(null)
    try {
      const saved = await saveResearchHistory({
        municipalityId: municipality.id,
        municipalityName: municipality.displayName,
        state: municipality.state,
        categoryId: category.id,
        categoryLabel: category.label,
        queryText: question,
        answer: nextAnswer,
      })

      if ('error' in saved) {
        setSaveError(saved.error)
        return
      }

      setHistoryId(saved.item.id)
      setHistory((current) => [saved.item, ...current.filter((item) => item.id !== saved.item.id)])
    } catch (error) {
      setSaveError(toErrorMessage(error, 'Could not save this research. Try again.'))
    } finally {
      setIsSavingHistory(false)
    }
  }

  async function submitQuery() {
    const municipality = getMunicipality(municipalityId)
    const category = getCategory(categoryId)
    if (!municipality || !category) {
      setSearchError('Select a municipality and a category before searching.')
      return
    }

    const validated = validateResearchQuery(query)
    if (!validated.ok) {
      setSearchError(validated.message)
      setAnswer(null)
      setViewingCitation(null)
      setHistoryId(null)
      return
    }

    const question = validated.query
    setQuery(question)
    setIsSearching(true)
    setSearchError(null)
    setSaveError(null)
    setFeedbackError(null)
    setFeedbackSuccess(null)
    setHistoryId(null)
    setAnswer(null)
    setViewingCitation(null)

    try {
      const live = await searchOfficialSources({
        municipalityId: municipality.id,
        categoryId: category.id,
        query: question,
      })

      let nextAnswer: ResearchAnswer

      if (live.ok) {
        nextAnswer = buildOfficialAnswer(
          municipality.displayName,
          live.data.results,
          live.data.retrievedAt,
          live.data.summary,
          question,
        )
      } else if (live.usePrototypeFallback) {
        const records = retrieveRecords(municipality.id, category.id, question)
        nextAnswer = buildPrototypeAnswer(municipality.displayName, category.label, records)
        setSearchError(
          `${live.error.message} Showing Prototype Reference demo results for this jurisdiction only. These are not official sources.`,
        )
      } else {
        setSearchError(live.error.message)
        return
      }

      setAnswer(nextAnswer)
      setViewingCitation(nextAnswer.citations[0] ?? null)
      await persistAnswer(municipality, category, nextAnswer, question)
    } catch (error) {
      setAnswer(null)
      setViewingCitation(null)
      setSearchError(
        `${toErrorMessage(
          error,
          'Official source search could not be completed.',
        )} This does not mean no building-code requirement exists.`,
      )
    } finally {
      setIsSearching(false)
    }
  }

  function openCitation(citation: Citation) {
    setViewingCitation(citation)
  }

  function reopenHistory(item: HistoryItem) {
    setMunicipalityId(item.municipalityId)
    setCategoryId(item.categoryId)
    setQuery(item.queryText)
    setAnswer({
      summary: item.answerText,
      citations: item.citations,
      isFallback: item.isFallback,
      includesPrototypeSources: item.includesPrototypeSources,
      sourceMode: item.sourceMode,
      retrievedAt: item.citations.find((citation) => citation.retrievedAt)?.retrievedAt,
    })
    setHistoryId(item.id)
    setViewingCitation(item.citations[0] ?? null)
    setSaveError(null)
    setFeedbackError(null)
    setFeedbackSuccess(null)
    setSearchError(null)
  }

  async function retrySave() {
    if (!answer) return
    const municipality = getMunicipality(municipalityId)
    const category = getCategory(categoryId)
    if (!municipality || !category) {
      setSaveError('Select a municipality and a category before saving.')
      return
    }
    const validated = validateResearchQuery(query)
    if (!validated.ok) {
      setSaveError(validated.message)
      return
    }
    await persistAnswer(municipality, category, answer, validated.query)
  }

  async function submitFeedback(rating: FeedbackRating, note?: string) {
    if (!historyId) {
      setFeedbackError('Save this research before sending feedback.')
      setFeedbackSuccess(null)
      return
    }
    setIsFeedbackSaving(true)
    setFeedbackError(null)
    setFeedbackSuccess(null)
    try {
      const result = await saveFeedback({ historyId, rating, note })
      if ('error' in result) {
        setFeedbackError(result.error)
        return
      }
      setFeedbackSuccess('Feedback saved.')
    } catch (error) {
      setFeedbackError(toErrorMessage(error, 'Feedback could not be saved. Try again.'))
    } finally {
      setIsFeedbackSaving(false)
    }
  }

  return {
    municipalityId,
    categoryId,
    query,
    setQuery,
    changeMunicipality,
    changeCategory,
    answer,
    viewingCitation,
    openCitation,
    history,
    historyId,
    isSearching,
    isSavingHistory,
    isHistoryLoading,
    isFeedbackSaving,
    searchError,
    saveError,
    historyError,
    feedbackError,
    feedbackSuccess,
    submitQuery,
    retrySave,
    reopenHistory,
    submitFeedback,
    reloadHistory: loadHistory,
  }
}
