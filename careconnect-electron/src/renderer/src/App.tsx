import { useEffect } from 'react'
import type { CareConnectApi } from '../../shared/api'
import { VIEW_LABELS, type ViewId } from '../../shared/commands'
import { AnnouncerProvider } from './a11y/Announcer'
import { ApiProvider } from './api/ApiContext'
import { CommandProvider } from './commands/CommandProvider'
import { AppHeader } from './components/AppHeader'
import { Sidebar } from './components/Sidebar'
import { SkipLinks } from './components/SkipLinks'
import { StatusBar } from './components/StatusBar'
import { ModalHost } from './dialogs/ModalHost'
import { useKeyboardShortcuts } from './keyboard/useKeyboardShortcuts'
import type { UiSlice } from './state/appState'
import { AppStateProvider, useAppDispatch, useAppState } from './state/AppStateProvider'
import { ClockProvider } from './state/clock'
import { InboxView } from './views/inbox/InboxView'
import { OverviewView } from './views/overview/OverviewView'
import { PatientsView } from './views/patients/PatientsView'
import { ReportsView } from './views/reports/ReportsView'
import { ResourcesView } from './views/resources/ResourcesView'
import { ScheduleView } from './views/schedule/ScheduleView'
import { TasksView } from './views/tasks/TasksView'

function CurrentView({ view }: { view: ViewId }): React.JSX.Element {
  switch (view) {
    case 'overview':
      return <OverviewView />
    case 'schedule':
      return <ScheduleView />
    case 'patients':
      return <PatientsView />
    case 'inbox':
      return <InboxView />
    case 'tasks':
      return <TasksView />
    case 'reports':
      return <ReportsView />
    case 'resources':
      return <ResourcesView />
  }
}

/** Mirrors preferences onto <html> so CSS can react: hints, theme, motion. */
function useDocumentAttributes(): void {
  const { workspace, ui } = useAppState()
  const preferences = workspace?.preferences
  const hints = Boolean(preferences?.showShortcutHints) || ui.revealHints
  useEffect(() => {
    const root = document.documentElement
    root.dataset.hints = hints ? 'on' : 'off'
    root.dataset.theme = preferences?.highContrast ? 'high-contrast' : 'default'
    root.dataset.motion = preferences?.reduceMotion ? 'reduce' : 'system'
  }, [hints, preferences?.highContrast, preferences?.reduceMotion])
  useEffect(() => {
    document.title = `${VIEW_LABELS[ui.view]} · CareConnect — Clinical workspace`
  }, [ui.view])
}

function AppShell(): React.JSX.Element {
  const state = useAppState()
  const dispatch = useAppDispatch()
  useKeyboardShortcuts()
  useDocumentAttributes()

  if (state.load.status === 'loading') {
    return (
      <div className="app-message" role="status">
        Loading CareConnect…
      </div>
    )
  }
  if (state.load.status === 'error') {
    return (
      <div className="app-message" role="alert">
        <h1>CareConnect couldn’t open your workspace</h1>
        <p>{state.load.message}</p>
        <button type="button" className="button button--primary" onClick={() => dispatch({ type: 'load/retry' })}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="app-shell" inert={state.ui.modal !== null}>
        <SkipLinks view={state.ui.view} />
        <Sidebar />
        <div className="workspace">
          <AppHeader />
          <main id="main" className="workspace__main" tabIndex={-1} aria-labelledby="view-title">
            <CurrentView view={state.ui.view} />
          </main>
        </div>
        <StatusBar />
      </div>
      <ModalHost />
    </>
  )
}

export interface AppProps {
  api: CareConnectApi
  /** Injected clock for tests; defaults to the system clock. */
  now?: () => Date
  initialUi?: Partial<UiSlice>
}

export function App({ api, now, initialUi }: AppProps): React.JSX.Element {
  return (
    <ApiProvider api={api}>
      <ClockProvider now={now}>
        <AnnouncerProvider>
          <AppStateProvider initialUi={initialUi}>
            <CommandProvider>
              <AppShell />
            </CommandProvider>
          </AppStateProvider>
        </AnnouncerProvider>
      </ClockProvider>
    </ApiProvider>
  )
}
