import { AccountBadge } from './components/AccountBadge'
import { AppShell } from './components/AppShell'
import { AnswerBlueprint } from './components/AnswerBlueprint'
import { AnswerPanel } from './components/AnswerPanel'
import { BlueprintHouse } from './components/BlueprintHouse'
import { CategorySelect } from './components/CategorySelect'
import { DisclaimerBanner } from './components/DisclaimerBanner'
import { FeedbackBar } from './components/FeedbackBar'
import { GuestNotice } from './components/GuestNotice'
import { HowGeneratedPanel } from './components/HowGeneratedPanel'
import { HistoryList } from './components/HistoryList'
import { LoginPage } from './components/LoginPage'
import { MunicipalitySelect } from './components/MunicipalitySelect'
import { QueryForm } from './components/QueryForm'
import { SampleQuestions } from './components/SampleQuestions'
import { SearchProgress } from './components/SearchProgress'
import { SourceViewer } from './components/SourceViewer'
import { StatusMessage } from './components/StatusMessage'
import { useCallback, useEffect, useState } from 'react'
import { getApprovedDomains } from './data/jurisdictions'
import { getMunicipality } from './data/municipalities'
import { useAuth } from './hooks/useAuth'
import { useResearch } from './hooks/useResearch'
import type { AccountUser } from './services/auth'
import { validateResearchQuery } from './services/queryValidation'
import { sampleQuestionPlaceholder, sampleQuestions } from './services/searchContext'

/** True when this page load is the redirect back from a Google OAuth attempt. */
function isOAuthReturn(): boolean {
  if (typeof window === 'undefined') return false
  const { search, hash } = window.location
  const params = new URLSearchParams(search)
  return (
    params.has('code') ||
    params.has('error') ||
    params.has('error_description') ||
    hash.includes('access_token=')
  )
}

function readOAuthError(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const description = params.get('error_description')
  const code = params.get('error')
  if (description) return description.replace(/\+/g, ' ')
  return code
}

export default function App() {
  const auth = useAuth()
  // The welcome screen is shown on every fresh page load / hard refresh.
  // React state resets on reload, so `entered` starts false unless we are
  // returning from the Google sign-in redirect.
  const [entered, setEntered] = useState(isOAuthReturn)
  const [oauthError] = useState(readOAuthError)

  // Strip OAuth params from the URL once the session exchange has settled.
  useEffect(() => {
    if (auth.status === 'loading') return
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    let changed = false
    for (const key of ['code', 'error', 'error_description', 'state']) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key)
        changed = true
      }
    }
    if (changed) {
      window.history.replaceState({}, '', url.pathname + url.search + url.hash)
    }
  }, [auth.status])

  const handleContinueAsGuest = useCallback(async () => {
    const ok = await auth.continueAsGuest()
    if (ok) setEntered(true)
  }, [auth])

  const handleSignInWithGoogle = useCallback(async () => {
    if (auth.status === 'authenticated' && auth.user && !auth.user.isGuest) {
      setEntered(true)
      return
    }
    await auth.signInWithGoogle()
  }, [auth])

  if (auth.status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-100 px-4">
        <StatusMessage>Starting a secure session…</StatusMessage>
      </div>
    )
  }

  if (!entered || auth.status !== 'authenticated' || !auth.user) {
    const authedNonGuest =
      auth.status === 'authenticated' && auth.user && !auth.user.isGuest ? auth.user : null
    return (
      <LoginPage
        authedName={authedNonGuest ? authedNonGuest.name ?? authedNonGuest.email : null}
        pending={auth.pending}
        error={auth.error ?? oauthError}
        onSignInWithGoogle={() => void handleSignInWithGoogle()}
        onContinueAsGuest={() => void handleContinueAsGuest()}
        onEnter={() => setEntered(true)}
        onSignOut={() => void auth.signOut()}
        onRetry={() => void auth.retry()}
      />
    )
  }

  return (
    <ResearchWorkspace
      key={auth.user.id}
      user={auth.user}
      pending={auth.pending}
      onSignInWithGoogle={() => void auth.signInWithGoogle()}
      onSignOut={() => void auth.signOut()}
    />
  )
}

type WorkspaceProps = {
  user: AccountUser
  pending: null | 'google' | 'guest' | 'signout'
  onSignInWithGoogle: () => void
  onSignOut: () => void
}

function ResearchWorkspace({
  user,
  pending,
  onSignInWithGoogle,
  onSignOut,
}: WorkspaceProps) {
  const research = useResearch()
  const formBusy = research.isSearching
  const formReady = Boolean(research.municipalityId && research.categoryId) && !formBusy
  const canSubmit = formReady && validateResearchQuery(research.query).ok
  const activeMunicipality = research.municipalityId
    ? getMunicipality(research.municipalityId)
    : undefined
  const activeDomains = research.municipalityId
    ? getApprovedDomains(research.municipalityId)
    : []

  return (
    <AppShell
      headerRight={
        <AccountBadge
          user={user}
          pending={pending}
          onSignInWithGoogle={onSignInWithGoogle}
          onSignOut={onSignOut}
        />
      }
    >
      <div className="space-y-6">
        <DisclaimerBanner />
        {user.isGuest ? (
          <GuestNotice pending={pending} onSignInWithGoogle={onSignInWithGoogle} />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
          <div className="space-y-4">
            <section className="bp-crop rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-blueprint-50/60 px-4 py-2.5 sm:px-5">
                <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-blueprint-700">
                  Research console
                </h2>
                <span className="font-mono text-[11px] text-slate-400">
                  {research.municipalityId && research.categoryId
                    ? 'Scope set'
                    : 'Set jurisdiction + category'}
                </span>
              </div>
              <div className="space-y-4 p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <MunicipalitySelect
                    value={research.municipalityId}
                    onChange={research.changeMunicipality}
                    disabled={formBusy}
                  />
                  <CategorySelect
                    value={research.categoryId}
                    onChange={research.changeCategory}
                    disabled={formBusy}
                  />
                </div>
                <QueryForm
                  query={research.query}
                  placeholder={sampleQuestionPlaceholder(
                    research.municipalityId,
                    research.categoryId,
                  )}
                  onQueryChange={research.setQuery}
                  onSubmit={() => void research.submitQuery()}
                  disabled={!formReady}
                  canSubmit={canSubmit}
                  isSearching={research.isSearching}
                />
                {research.municipalityId && research.categoryId && !research.isSearching ? (
                  <SampleQuestions
                    questions={sampleQuestions(research.municipalityId, research.categoryId)}
                    onPick={research.setQuery}
                    disabled={research.isSearching}
                  />
                ) : null}
              </div>
            </section>

            {research.searchError ? (
              <StatusMessage tone="error">
                {research.searchError}{' '}
                <button
                  type="button"
                  className="font-medium underline"
                  onClick={() => void research.submitQuery()}
                  disabled={formBusy}
                >
                  Search again
                </button>
              </StatusMessage>
            ) : null}
            {research.isSavingHistory ? (
              <StatusMessage>Saving this research to history…</StatusMessage>
            ) : null}
            {research.saveError ? (
              <StatusMessage tone="error">
                {research.saveError}{' '}
                <button
                  type="button"
                  className="font-medium underline"
                  onClick={() => void research.retrySave()}
                  disabled={research.isSavingHistory || !research.answer}
                >
                  Retry save
                </button>
              </StatusMessage>
            ) : null}

            {!research.answer && !research.isSearching && !research.searchError ? (
              <div className="bp-sheet bp-crop overflow-hidden rounded-xl border border-blueprint-200 p-4 sm:p-5">
                <BlueprintHouse
                  category={research.categoryId}
                  className="mx-auto max-w-[600px]"
                />
                <p className="mt-3 border-t border-dashed border-blueprint-200 pt-3 text-sm text-slate-600">
                  Set a jurisdiction and category above, then ask a question. CodeTrace searches
                  only that jurisdiction’s official municipal domains and traces the answer back to
                  the source passage.
                </p>
              </div>
            ) : null}

            {research.isSearching ? (
              <SearchProgress
                municipalityName={activeMunicipality?.displayName}
                domains={activeDomains}
              />
            ) : null}

            {research.answer && !research.isSearching ? (
              <>
                <AnswerPanel
                  answer={research.answer}
                  onViewSource={research.openCitation}
                />
                <AnswerBlueprint
                  question={research.query}
                  categoryId={research.categoryId}
                  answer={research.answer}
                />
                <FeedbackBar
                  disabled={!research.historyId || research.isSavingHistory}
                  saving={research.isFeedbackSaving}
                  error={research.feedbackError}
                  success={research.feedbackSuccess}
                  onSubmit={(rating, note) => void research.submitFeedback(rating, note)}
                />
                <HowGeneratedPanel />
              </>
            ) : (
              <HowGeneratedPanel />
            )}
          </div>

          <div className="space-y-4">
            <SourceViewer citation={research.isSearching ? null : research.viewingCitation} />
            <HistoryList
              items={research.history}
              loading={research.isHistoryLoading}
              error={research.historyError}
              onRetry={() => void research.reloadHistory()}
              onReopen={research.reopenHistory}
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
