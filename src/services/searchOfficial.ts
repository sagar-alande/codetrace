import type { OfficialSearchResponse, SearchFunctionError } from '../types/research'
import { getSupabase } from './supabaseClient'
import { QUERY_VALIDATION_MESSAGE, validateResearchQuery } from './queryValidation'
import { toErrorMessage } from './text'

const PUBLIC_SEARCH_ERRORS: Record<string, string> = {
  INVALID_REQUEST: 'This search request is not valid. Check your question and try again.',
  INVALID_QUERY: QUERY_VALIDATION_MESSAGE,
  INVALID_MUNICIPALITY: 'The selected municipality is not supported.',
  UNSUPPORTED_CATEGORY: 'The selected category is not supported.',
  UNAUTHORIZED: 'A signed-in session is required.',
  RATE_LIMIT:
    'Official source search is temporarily rate-limited. This does not mean no building-code requirement exists.',
  TIMEOUT:
    'Official source search timed out. This does not mean no building-code requirement exists.',
  TAVILY_ERROR:
    'Official source search failed. This does not mean no building-code requirement exists.',
  MISSING_TAVILY_KEY: 'Official source search is not configured on the server.',
}

function publicErrorMessage(code: string | undefined, fallback: string): string {
  if (code && PUBLIC_SEARCH_ERRORS[code]) return PUBLIC_SEARCH_ERRORS[code]
  return fallback
}

export async function searchOfficialSources(input: {
  municipalityId: string
  categoryId: string
  query: string
}): Promise<
  | { ok: true; data: OfficialSearchResponse }
  | { ok: false; error: SearchFunctionError; usePrototypeFallback: boolean }
> {
  const validated = validateResearchQuery(input.query)
  if (!validated.ok) {
    return {
      ok: false,
      usePrototypeFallback: false,
      error: { code: 'INVALID_QUERY', message: validated.message },
    }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return {
      ok: false,
      usePrototypeFallback: true,
      error: {
        code: 'SUPABASE_NOT_CONFIGURED',
        message:
          'Supabase is not configured, so live official-source search cannot run.',
      },
    }
  }

  let data: unknown
  let error: { message: string; context?: { status?: number } } | null = null
  try {
    const invoked = await supabase.functions.invoke('search-building-code', {
      body: {
        municipalityId: input.municipalityId,
        categoryId: input.categoryId,
        query: validated.query,
      },
    })
    data = invoked.data
    error = invoked.error
  } catch (caught) {
    return {
      ok: false,
      usePrototypeFallback: false,
      error: {
        code: 'NETWORK_ERROR',
        message: `${toErrorMessage(
          caught,
          'Official source search could not be completed.',
        )} This does not mean no building-code requirement exists.`,
      },
    }
  }

  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status
    const body = data as { error?: SearchFunctionError } | null
    const code = body?.error?.code
    const usePrototypeFallback = code === 'MISSING_TAVILY_KEY' || status === 404

    const message = publicErrorMessage(
      code ?? (status === 429 ? 'RATE_LIMIT' : status === 504 ? 'TIMEOUT' : undefined),
      'Official source search could not be completed. This does not mean no building-code requirement exists.',
    )

    return {
      ok: false,
      usePrototypeFallback,
      error: { code: code ?? 'FUNCTION_ERROR', message },
    }
  }

  const payload = data as (OfficialSearchResponse & { error?: SearchFunctionError }) | null
  if (!payload) {
    return {
      ok: false,
      usePrototypeFallback: false,
      error: {
        code: 'INVALID_RESPONSE',
        message:
          'Official source search returned an unexpected response. This does not mean no building-code requirement exists.',
      },
    }
  }
  if (payload.error) {
    return {
      ok: false,
      usePrototypeFallback: payload.error.code === 'MISSING_TAVILY_KEY',
      error: {
        code: payload.error.code,
        message: publicErrorMessage(
          payload.error.code,
          'Official source search could not be completed. This does not mean no building-code requirement exists.',
        ),
      },
    }
  }

  if (!Array.isArray(payload.results) || !payload.retrievedAt) {
    return {
      ok: false,
      usePrototypeFallback: false,
      error: {
        code: 'INVALID_RESPONSE',
        message:
          'Official source search returned an unexpected response. This does not mean no building-code requirement exists.',
      },
    }
  }

  return { ok: true, data: payload }
}
